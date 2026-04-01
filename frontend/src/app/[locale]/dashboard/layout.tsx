"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  LayoutDashboard,
  Building2,
  FileText,
  BarChart3,
  Upload,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { key: "overview", href: "/dashboard", icon: LayoutDashboard },
  { key: "companies", href: "/dashboard/companies", icon: Building2 },
  { key: "documents", href: "/dashboard/documents", icon: FileText },
  { key: "reports", href: "/dashboard/reports", icon: BarChart3 },
  { key: "upload", href: "/dashboard/upload", icon: Upload },
  { key: "settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">ES</span>
          </div>
        ) : (
          <Logo size="sm" />
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {!collapsed && <span>{t(`dashboard.nav.${item.key}`)}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User section */}
      <div className={`px-3 py-4 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.full_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || ""}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-foreground p-1"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute right-2 top-2">
          <button onClick={() => setMobileOpen(false)} className="p-1 text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border bg-card transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-20 -right-3 z-10 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-muted"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1 text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
