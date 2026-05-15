/* eslint-disable react-hooks/static-components */
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserTour } from "@/components/tour/user-tour";
import { NotificationBell } from "@/components/notification-bell";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Upload,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  Target,
  Brain,
  Shield,
  Loader2,
  Star,
  Leaf,
  CreditCard,
  FlaskConical,
  BookOpen,
  MessageSquare,
  Cloud,
  Globe2,
  ScrollText,
  UserCog,
  Coins,
  Thermometer,
  Banknote,
  Briefcase,
  Landmark,
  Calculator,
  TrendingDown,
} from "lucide-react";

const navItems = [
  { key: "overview", href: "/dashboard", icon: LayoutDashboard },
  { key: "financialScore", href: "/dashboard/financial-score", icon: Coins },
  { key: "climateRisk", href: "/dashboard/climate-risk", icon: Thermometer },
  { key: "fundingReadiness", href: "/dashboard/funding-readiness", icon: Banknote },
  { key: "portfolio", href: "/dashboard/portfolio", icon: Briefcase },
  { key: "creditIntel", href: "/dashboard/credit-intelligence", icon: Landmark },
  { key: "valuation", href: "/dashboard/valuation", icon: Calculator },
  { key: "macc", href: "/dashboard/macc", icon: TrendingDown },
  { key: "reports", href: "/dashboard/reports", icon: BarChart3 },
  { key: "upload", href: "/dashboard/upload", icon: Upload },
  { key: "esgScore", href: "/dashboard/esg-score", icon: Target },
  { key: "dataPoints", href: "/dashboard/data-points", icon: Leaf },
  { key: "frameworks", href: "/dashboard/frameworks", icon: BookOpen },
  { key: "insights", href: "/dashboard/insights", icon: Brain },
  { key: "emissions", href: "/dashboard/emissions", icon: Cloud },
  { key: "chat", href: "/dashboard/chat", icon: MessageSquare },
  { key: "regulatory", href: "/dashboard/regulatory", icon: Globe2 },
  { key: "templates", href: "/dashboard/templates", icon: FileText },
  { key: "auditLog", href: "/dashboard/audit-log", icon: ScrollText },
  { key: "simulate", href: "/dashboard/simulate", icon: FlaskConical },
];

const bottomNavItems = [
  { key: "subscription", href: "/dashboard/subscription", icon: CreditCard },
  { key: "privacy", href: "/dashboard/privacy", icon: UserCog },
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

  const isAdmin = user?.is_superadmin === true;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const NavItem = ({ item }: { item: (typeof navItems)[0] }) => {
    const isActive =
      item.href === "/dashboard"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(item.href + "/");

    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? t(`dashboard.nav.${item.key}`) : undefined}
        data-tour={`nav-${item.key}`}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
          isActive
            ? "bg-emerald-500/12 text-emerald-400"
            : "text-[#6b8aad] hover:bg-white/5 hover:text-slate-200"
        } ${collapsed ? "justify-center px-2" : ""}`}
      >
        {/* Active indicator */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-emerald-400 shadow-sm"
            style={{ boxShadow: "0 0 8px rgba(16,185,129,0.6)" }} />
        )}
        <item.icon
          className={`shrink-0 transition-colors ${collapsed ? "h-4.5 w-4.5" : "h-4 w-4"} ${
            isActive ? "text-emerald-400" : "text-[#4a6380] group-hover:text-slate-300"
          }`}
        />
        {!collapsed && (
          <span className="truncate text-[13px] tracking-[-0.01em]">{t(`dashboard.nav.${item.key}`)}</span>
        )}
        {isActive && !collapsed && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500/60 shrink-0" />
        )}
      </Link>
    );
  };

  // eslint-disable-next-line react-hooks/static-components
  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "#0b1220" }}>
      {/* Logo area */}
      <div className={`flex items-center h-[57px] px-4 shrink-0 border-b ${collapsed ? "justify-center" : "gap-3"}`}
        style={{ borderColor: "#1a2740" }}>
        <Logo size="sm" showText={false} />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4" data-tour="sidebar-nav">
        {/* Section label */}
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] px-3 mb-2"
            style={{ color: "#2e4a6a" }}>
            {t("dashboard.navSectionNavigation")}
          </p>
        )}

        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <NavItem key={item.key} item={item} />
          ))}
        </nav>

        {/* Divider */}
        <div className="my-4 mx-3 h-px" style={{ background: "#1a2740" }} />

        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] px-3 mb-2"
            style={{ color: "#2e4a6a" }}>
            {t("dashboard.nav.settings")}
          </p>
        )}

        <nav className="space-y-0.5">
          {bottomNavItems.map((item) => (
            <NavItem key={item.key} item={item} />
          ))}
        </nav>

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="my-4 mx-3 h-px" style={{ background: "#1a2740" }} />
            {!collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] px-3 mb-2"
                style={{ color: "#2e4a6a" }}>
                {t("dashboard.navSectionAdmin")}
              </p>
            )}
            <nav className="space-y-0.5">
              {adminNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? t(`dashboard.nav.${item.key}`) : undefined}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 text-[#6b8aad] hover:bg-white/5 hover:text-slate-200 ${collapsed ? "justify-center px-2" : ""}`}
                >
                  <item.icon className="h-4 w-4 shrink-0 text-[#4a6380] group-hover:text-slate-300 transition-colors" />
                  {!collapsed && (
                    <span className="truncate text-[13px] flex items-center gap-2">
                      {t(`dashboard.nav.${item.key}`)}
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 h-4 font-mono bg-amber-500/10 text-amber-400 border-0"
                      >
                        {t("dashboard.adminBadge")}
                      </Badge>
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </>
        )}
      </ScrollArea>

      {/* Divider */}
      <div className="mx-3 h-px shrink-0" style={{ background: "#1a2740" }} />

      {/* Plan indicator */}
      {!collapsed && (
        <div className="mx-2 my-2 shrink-0 rounded-xl px-3 py-2.5" style={{ background: "#0d1829", border: "1px solid #1a2740" }}>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <Star className="h-3 w-3 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-emerald-400 leading-none">{t("dashboard.planProfessional")}</p>
              <p className="text-[10px] mt-0.5 leading-none" style={{ color: "#3a5a7a" }}>{t("dashboard.planActive")}</p>
            </div>
          </div>
        </div>
      )}

      {/* User section */}
      <div className={`px-2 py-3 shrink-0 ${collapsed ? "flex justify-center" : ""}`}
        style={{ background: "#0b1220" }}>
        {collapsed ? (
          <button
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#4a6380] hover:bg-red-500/10 hover:text-red-400 transition-colors"
            title={t("dashboard.signOut")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/4 transition-colors group cursor-default">
            <Avatar className="h-8 w-8 shrink-0 border border-white/10">
              <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-200 truncate leading-tight">
                {user?.full_name || "User"}
              </p>
              <p className="text-[11px] truncate leading-tight" style={{ color: "#4a6380" }}>
                {user?.email || ""}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-[#2e4a6a] hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
              title={t("dashboard.signOut")}
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transform transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#0b1220", borderRight: "1px solid #1a2740" }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 p-1.5 rounded-lg text-[#4a6380] hover:bg-white/5 hover:text-slate-300 transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`relative hidden lg:flex flex-col shrink-0 transition-all duration-200 ${
          collapsed ? "w-[60px]" : "w-[228px]"
        }`}
        style={{ background: "#0b1220", borderRight: "1px solid #1a2740" }}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[70px] z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-card shadow-lg hover:scale-110 transition-all duration-150"
          style={{ borderColor: "#1a2740" }}
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
        <header className="flex items-center justify-between h-[57px] px-4 sm:px-6 border-b border-border/60 bg-background/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground/30">/</span>
              <span className="font-semibold text-foreground">
                {pathname === "/dashboard"
                  ? t("dashboard.nav.overview")
                  : pathname.includes("/reports")
                  ? t("dashboard.nav.reports")
                  : pathname.includes("/upload")
                  ? t("dashboard.nav.upload")
                  : pathname.includes("/esg-score")
                  ? t("dashboard.nav.esgScore")
                  : pathname.includes("/insights")
                  ? t("dashboard.nav.insights")
                  : pathname.includes("/settings")
                  ? t("dashboard.nav.settings")
                  : "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2" data-tour="topbar-actions">
            {/* Search */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2 h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border/60 bg-muted/40 rounded-lg font-normal"
            >
              <Search className="h-3.5 w-3.5" />
              <span>{t("common.search")}...</span>
              <kbd className="ml-2 text-[10px] bg-background border border-border/60 rounded px-1.5 py-0.5 font-mono text-muted-foreground/60">
                ⌘K
              </kbd>
            </Button>

            <LanguageSwitcher />
            <ThemeToggle />

            {/* Notifications */}
            <NotificationBell />

            {/* Avatar (mobile) */}
            <Avatar className="h-8 w-8 lg:hidden border border-border/60">
              <AvatarFallback className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
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

      {/* Product tour for normal users */}
      <UserTour />
    </div>
  );
}
