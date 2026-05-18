/* eslint-disable react-hooks/static-components */
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
import { AdminTour } from "@/components/tour/admin-tour";
import {
  LayoutDashboard,
  Layers,
  Building2,
  Users,
  Brain,
  Settings,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Shield,
  Loader2,
  CreditCard,
  Tag,
  FileText,
  AlertTriangle,
  Handshake,
  Sparkles,
} from "lucide-react";

const adminNavItems = [
  { key: "overview", href: "/admin", icon: LayoutDashboard },
  { key: "frameworks", href: "/admin/frameworks", icon: Layers },
  { key: "companies", href: "/admin/companies", icon: Building2 },
  { key: "users", href: "/admin/users", icon: Users },
  { key: "aiLogs", href: "/admin/ai-logs", icon: Brain },
  { key: "settings", href: "/admin/settings", icon: Settings },
  { key: "payments", href: "/admin/payments", icon: CreditCard },
  { key: "coupons", href: "/admin/coupons", icon: Tag },
  { key: "auditLog", href: "/admin/audit-log", icon: FileText },
  { key: "errorLogs", href: "/admin/error-logs", icon: AlertTriangle },
  { key: "partners", href: "/admin/partners", icon: Handshake },
  { key: "intelligence", href: "/admin/intelligence", icon: Sparkles },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.is_superadmin === true;

  // Auth + Admin guard
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (!isAdmin) {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, isAdmin, router]);

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // eslint-disable-next-line react-hooks/static-components
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo + Admin badge */}
      <div className="flex items-center justify-between px-4 py-5">
        <Logo size="sm" />
        <Badge variant="secondary" className="text-xs font-mono">
          <Shield className="mr-1 h-3 w-3" />
          Admin
        </Badge>
      </div>

      <Separator />

      {/* Back to dashboard */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 pb-4" data-tour="admin-sidebar">
        <nav className="space-y-1">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                data-tour={`admin-nav-${item.key}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                <span>{t(`admin.nav.${item.key}`)}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      <div className="px-3 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {user?.full_name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.full_name || "Admin"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground p-1">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
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
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1">
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="hidden lg:block" />
          <LanguageSwitcher />
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Product tour for admins */}
      <AdminTour />
    </div>
  );
}
