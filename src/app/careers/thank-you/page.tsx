"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ArrowLeft,
  MessageSquare,
  FileSearch,
  Phone,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";

export default function ThankYouPage() {
  const applicationNumber = `APP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center shadow-xl shadow-slate-100/50">
          {/* Success Icon */}
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30" />
            <div className="relative flex items-center justify-center w-24 h-24 bg-green-100 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Application Submitted Successfully!
          </h1>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Thank you for your interest. We&apos;re excited to review your application.
          </p>

          {/* Application Number */}
          <div className="bg-slate-50 rounded-2xl p-5 mb-8">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
              Application Reference
            </p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600 tracking-wide">
              {applicationNumber}
            </p>
          </div>

          {/* What Happens Next */}
          <div className="text-left mb-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              What happens next?
            </h3>
            <div className="space-y-4">
              {[
                {
                  icon: FileSearch,
                  title: "Application Review",
                  desc: "Our HR team will review your application and resume within 3-5 business days.",
                },
                {
                  icon: MessageSquare,
                  title: "WhatsApp Update",
                  desc: "You&apos;ll receive a confirmation and status updates via WhatsApp.",
                },
                {
                  icon: Phone,
                  title: "Initial Screening",
                  desc: "If shortlisted, our recruiter will contact you for a brief phone screening.",
                },
                {
                  icon: CalendarCheck,
                  title: "Interview Schedule",
                  desc: "Selected candidates will be invited for a formal interview with the team.",
                },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <div className="flex items-center justify-center w-9 h-9 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                    <step.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100 mb-8" />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-600/25 transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Browse More Jobs
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3 text-slate-600 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
            >
              Go to Homepage
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Your personal data is protected under our{" "}
            <a href="#" className="text-blue-500 hover:underline">
              Privacy Policy
            </a>{" "}
            and will only be used for recruitment purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
