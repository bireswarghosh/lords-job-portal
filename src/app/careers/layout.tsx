import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  ArrowRight,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "All Jobs", href: "/careers" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/careers" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/20 group-hover:shadow-lg group-hover:shadow-blue-600/30 transition-shadow">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v4" />
                  <path d="M10 6h4" />
                  <path d="M12 14v4" />
                  <path d="M10 16h4" />
                  <path d="M4 12h4" />
                  <path d="M6 10v4" />
                  <path d="M16 12h4" />
                  <path d="M18 10v4" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-900 leading-tight tracking-tight">
                  LordsJobs
                </span>
                <span className="text-[10px] font-medium text-blue-600 uppercase tracking-widest">
                  Healthcare Careers
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/careers"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30 transition-all"
              >
                View Openings
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                aria-label="Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="relative bg-slate-900 text-slate-300 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4v4" />
                    <path d="M10 6h4" />
                    <path d="M12 14v4" />
                    <path d="M10 16h4" />
                    <path d="M4 12h4" />
                    <path d="M6 10v4" />
                    <path d="M16 12h4" />
                    <path d="M18 10v4" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-lg">LordsJobs</p>
                  <p className="text-xs text-blue-400 font-medium">Healthcare Careers</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Connecting talented healthcare professionals with leading hospitals
                across India. Your next career move starts here.
              </p>
              <div className="flex items-center gap-3 pt-2">
                {[
                  { label: "Facebook", path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
                  { label: "Twitter", path: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" },
                  { label: "Instagram", path: "M7.5 2h9A5.5 5.5 0 0122 7.5v9a5.5 5.5 0 01-5.5 5.5h-9A5.5 5.5 0 012 16.5v-9A5.5 5.5 0 017.5 2zm4.5 5a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm5.25-3.5a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" },
                  { label: "LinkedIn", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" },
                ].map((social, i) => (
                  <a
                    key={i}
                    href="#"
                    aria-label={social.label}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={social.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2.5">
                {[
                  { label: "Browse All Jobs", href: "/careers" },
                  { label: "About Us", href: "/about" },
                  { label: "Our Hospitals", href: "/hospitals" },
                  { label: "Employee Benefits", href: "/benefits" },
                  { label: "Internship Programs", href: "/internships" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Departments
              </h3>
              <ul className="space-y-2.5">
                {[
                  "Emergency Medicine",
                  "Cardiology",
                  "Nursing",
                  "Radiology",
                  "Pharmacy",
                  "Administration",
                ].map((dept) => (
                  <li key={dept}>
                    <Link
                      href="/careers"
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {dept}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Contact Us
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
                  <span className="text-sm">
                    123 Medical Center Road, Mumbai 400001
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                  <a href="tel:+912223456789" className="text-sm hover:text-white transition-colors">
                    +91 22 2345 6789
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <a href="mailto:careers@lordsjobs.com" className="text-sm hover:text-white transition-colors">
                    careers@lordsjobs.com
                  </a>
                </li>
              </ul>
              <div className="mt-5 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">HR Helpline</p>
                <p className="text-sm text-white font-semibold">+91 98765 43210</p>
                <p className="text-xs text-slate-500 mt-1">Mon - Sat, 9:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} LordsJobs Healthcare Network. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <span>·</span>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <span>·</span>
              <a href="#" className="hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
