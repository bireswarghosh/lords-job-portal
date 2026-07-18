import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HospitalRecruit - HR Recruitment Management",
  description: "Enterprise Hospital HR Recruitment & Candidate Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
