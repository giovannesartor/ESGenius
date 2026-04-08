"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Search,
  Target,
  Brain,
  Shield,
  Loader2,
} from "lucide-react";

const ADMIN_EMAIL = "giovannesartor@gmail.com";

const navItems = [
  { key: "overview", href: "/dashboard", icon: LayoutDashboard },
  { key: "reports", href: "/dashboard/reports", icon: BarChart3 },
  { key: "upload", href: "/dashboard/upload", icon: Upload },
  { key: "esgScore", href: "/dashboard/esg-score", icon: Target },
  { key: "insights", href: "/dashboard/insights", icon: Brain },
];

const bottomNavItems = [
  { key: "settings", href: "/dashboard/settings", icon: Settings },
];

const adminNavItems = [
  { key: "adminDashboard", href: "/admin", icon: Shield },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const NavItem = ({
    item,
  }: {
    item: (typeof navItems)[0];
  }) => {
    const isActive =
      item.href === "/dashboard"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(item.href + "/");

    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? t(`dashboard.nav.${item.key}`) : undefined}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
          isActive
            ? "bg-primary/10 text-primary shadow-sm"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        } ${collapsed ? "justify-center" : ""}`}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary" />
        )}
        <item.icon
          className={`h-4.5 w-4.5 shrink-0 transition-colors ${
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          }`}
        />
        {!collapsed && (
          <span className="truncate">{t(`dashboard.nav.${item.key}`)}</span>
        )}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center h-14 px-4 ${collapsed ? "justify-center" : "gap-3"}`}>
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
            <span className="text-[11px] font-bold text-primary-foreground tracking-tight">ES</span>
          </div>
        ) : (
          <Logo size="sm" />
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <NavItem key={item.key} item={item} />
          ))}
        </nav>

        {!collapsed && (
          <div className="mt-6 mb-2 px-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {t("dashboard.nav.settings")}
            </p>
          </div>
        )}
        {collapsed && <Separator className="my-3" />}

        <nav className="space-y-0.5 mt-1">
          {bottomNavItems.map((item) => (
            <NavItem key={item.key} item={item} />
          ))}
        </nav>

        {/* Admin section */}
        {isAdmin && (
          <>
            {!collapsed && (
              <div className="mt-6 mb-2 px-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Admin
                </p>
              </div>
            )}
            {collapsed && <Separator className="my-3" />}
            <nav className="space-y-0.5 mt-1">
              {adminNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? t(`dashboard.nav.${item.key}`) : undefined}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 text-muted-foreground hover:bg-muted/60 hover:text-foreground ${collapsed ? "justify-center" : ""}`}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                  {!collapsed && (
                    <span className="truncate flex items-center gap-2">
                      {t(`dashboard.nav.${item.key}`)}
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-mono">
                        Admin
                      </Badge>
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </>
        )}
      </ScrollArea>

      <Separator />

      {/* User section */}
      <div className={`px-2 py-3 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <button
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted/50 transition-colors group">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                {user?.full_name || "User"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">
                {user?.email || ""}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground/50 hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
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
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-xl transform transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`relative hidden lg:flex flex-col border-r border-border bg-card transition-all duration-200 ${
          collapsed ? "w-[60px]" : "w-60"
        }`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[68px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 px-4 sm:px-6 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">ESG360</span>
              <ChevronRight className="h-3 w-3" />
              <span>Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2 h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border/60 bg-muted/30"
            >
              <Search className="h-3.5 w-3.5" />
              <span>{t("common.search")}...</span>
              <kbd className="ml-2 text-[10px] bg-background border border-border rounded px-1.5 py-0.5 font-mono">
                ⌘K
              </kbd>
            </Button>
            <LanguageSwitcher />
            <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
            </button>
            <Avatar className="h-8 w-8 lg:hidden">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
