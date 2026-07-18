"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, FileText, Calendar, RefreshCw, Clock, FileCheck, X,
} from "lucide-react";
import { cn, timeAgo, formatDateTime } from "@/lib/utils";
import { getNotifications, markAsRead, markAllAsRead as markAllDB } from "@/app/actions/notifications";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  entityId?: string | null;
  entityType?: string | null;
  userId?: string | null;
};

const typeIconMap: Record<string, typeof Bell> = {
  application: FileText,
  interview: Calendar,
  status_change: RefreshCw,
  reminder: Clock,
  document: FileCheck,
};

const typeColorMap: Record<string, string> = {
  application: "bg-blue-100 text-blue-600",
  interview: "bg-purple-100 text-purple-600",
  status_change: "bg-green-100 text-green-600",
  reminder: "bg-amber-100 text-amber-600",
  document: "bg-gray-100 text-gray-600",
};

const typeLabel: Record<string, string> = {
  application: "Application",
  interview: "Interview",
  status_change: "Status Change",
  reminder: "Reminder",
  document: "Document",
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: () => void;
}

export default function NotificationPanel({ isOpen, onClose, onCountChange }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await getNotifications();
    if (res.success) setNotifications(res.data as unknown as Notification[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (isOpen) fetchData(); }, [isOpen, fetchData]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    onCountChange?.();
  };

  const handleMarkAllRead = async () => {
    await markAllDB();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onCountChange?.();
  };

  const handleClickNotification = (n: Notification) => {
    setSelectedNotification(n);
    if (!n.read) handleMarkAsRead(n.id);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-[400px] max-h-[520px] bg-surface border border-border rounded-xl shadow-lg z-50 flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary hover:text-primary-dark font-medium transition-colors">Mark all read</button>
            )}
            <button onClick={onClose} className="p-1 text-text-secondary hover:text-text-primary rounded-md hover:bg-background transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <Bell className="w-10 h-10 mb-3 text-text-muted" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs mt-1">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => {
                const Icon = typeIconMap[notification.type] || Bell;
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleClickNotification(notification)}
                    className={cn("w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-background transition-colors", !notification.read && "bg-primary/5")}
                  >
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", typeColorMap[notification.type] || "bg-gray-100 text-gray-600")}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm font-medium leading-snug", notification.read ? "text-text-secondary" : "text-text-primary")}>{notification.title}</p>
                        {!notification.read && <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-text-muted mt-1">{timeAgo(notification.createdAt)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-2.5">
          <button onClick={onClose} className="w-full text-center text-sm font-medium text-primary hover:text-primary-dark transition-colors">Close</button>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selectedNotification} onClose={() => setSelectedNotification(null)} size="md">
        {selectedNotification && (
          <>
            <ModalHeader onClose={() => setSelectedNotification(null)}>Notification Details</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", typeColorMap[selectedNotification.type] || "bg-gray-100 text-gray-600")}>
                    {(() => { const Icon = typeIconMap[selectedNotification.type] || Bell; return <Icon className="w-6 h-6" />; })()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{selectedNotification.title}</h3>
                    <Badge variant="outline" className="mt-1">{typeLabel[selectedNotification.type] || selectedNotification.type}</Badge>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-text-primary leading-relaxed">{selectedNotification.message}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-secondary mb-0.5">Received</p>
                    <p className="font-medium text-text-primary">{formatDateTime(selectedNotification.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary mb-0.5">Status</p>
                    <Badge variant={selectedNotification.read ? "default" : "primary"}>{selectedNotification.read ? "Read" : "Unread"}</Badge>
                  </div>
                  {selectedNotification.entityType && (
                    <div>
                      <p className="text-text-secondary mb-0.5">Related To</p>
                      <p className="font-medium text-text-primary capitalize">{selectedNotification.entityType}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setSelectedNotification(null)}>Close</Button>
                </div>
              </div>
            </ModalBody>
          </>
        )}
      </Modal>
    </>
  );
}
