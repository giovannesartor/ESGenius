"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Bell,
  Megaphone,
  CheckSquare,
  FileBarChart2,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Handshake,
  Loader2,
} from "lucide-react";

// ─── Partner Auth Context ─────────────────────────────────────────────────────

interface PartnerUser {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  ref_code: string;
  commission_rate: number;
  status: string;
  pix_key_type?: string;
  pix_key?: string;
  brand_color?: string;
  logo_url?: string;
}

interface PartnerAuthCtx {
  partner: PartnerUser | null;
  token: string | null;
  isLoading: boolean;
  logout: () => void;
}

const PartnerAuthContext = createContext<PartnerAuthCtx>({
  partner: null,
  token: null,
  isLoading: true,
  logout: () => {},
});

export function usePartnerAuth() {
  return useContext(PartnerAuthContext);
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const partnerNavItems = [
  { key: "dashboard", href: "/partner", icon: LayoutDashboard },
  { key: "clients", href: "/partner/clients", icon: Users },
  { key: "commissions", href: "/partner/commissions", icon: DollarSign },
  { key: "followUp", href: "/partner/follow-up", icon: Bell },
  { key: "marketing", href: "/partner/marketing", icon: Megaphone },
  { key: "tasks", href: "/partner/tasks", icon: CheckSquare },
  { key: "freeReport", href: "/partner/free-report", icon: FileBarChart2 },
];

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const [partner, setPartner] = useState<PartnerUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("partner_token");
    const storedPartner = localStorage.getItem("partner_user");
    if (storedToken && storedPartner) {
      try {
        setToken(storedToken);
        setPartner(JSON.parse(storedPartner));
      } catch {
        localStorage.removeItem("partner_token");
        localStorage.removeItem("partner_user");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && !partner) {
      router.push("/partner/login");
    }
  }, [isLoading, partner, router]);

  const logout = () => {
    localStorage.removeItem("partner_token");
    localStorage.removeItem("partner_user");
    setPartner(null);
    setToken(null);
    router.push("/partner/login");
  };

  if (isLoading || !partner) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo + Partner badge */}
      <div className="flex items-center justify-between px-4 py-5">
        <Logo size="sm" />
        <Badge variant="secondary" className="text-xs font-mono">
          <Handshake className="mr-1 h-3 w-3" />
          Partner
        </Badge>
      </div>

      <Separator />

      {/* Back to site */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("common.backToSite")}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 pb-4">
        <nav className="space-y-1">
          {partnerNavItems.map((item) => {
            const isActive =
              item.href === "/partner"
                ? pathname === "/partner"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{t(`partner.nav.${item.key}`)}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Partner info + logout */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {partner?.full_name?.charAt(0) || "P"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{partner?.full_name}</p>
            <p className="text-xs text-muted-foreground font-mono truncate">REF: {partner?.ref_code}</p>
          </div>
          <button onClick={logout} className="text-muted-foreground hover:text-foreground p-1">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <PartnerAuthContext.Provider value={{ partner, token, isLoading, logout }}>
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
      </div>
    </PartnerAuthContext.Provider>
  );
}
