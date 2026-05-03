"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ScanSearch,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/scan", label: "Scan & Upload", icon: ScanSearch },
  { href: "/dashboard/registry", label: "Registre Art. 30", icon: FileText },
  { href: "/dashboard/alerts", label: "Alertes", icon: Bell },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between gap-3 px-4 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {(isMobile || !collapsed) && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="text-lg font-bold gradient-text-shield whitespace-nowrap">
                ShieldFlow
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-accent-cyan/15 to-accent-violet/15 text-accent-cyan border border-accent-cyan/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              )}>
              <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-accent-cyan" : "")} />
              <AnimatePresence>
                {(isMobile || !collapsed) && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Collapse (desktop only) */}
      {!isMobile && (
        <div className="p-3 border-t border-border-subtle">
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors cursor-pointer">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span className="text-xs">Réduire</span></>}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl glass text-text-secondary hover:text-text-primary cursor-pointer">
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed top-0 left-0 h-screen w-[260px] z-50 flex flex-col border-r border-border-subtle bg-bg-surface lg:hidden">
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex fixed top-0 left-0 h-screen z-40 flex-col border-r border-border-subtle bg-bg-surface/80 backdrop-blur-xl">
        {sidebarContent(false)}
      </motion.aside>
    </>
  );
}
