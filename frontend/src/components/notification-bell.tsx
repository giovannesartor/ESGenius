"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsApi } from "@/services/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  title: string;
  body?: string | null;
  type: string;
  is_read: boolean;
  link_url?: string | null;
  created_at: string;
}

export function NotificationBell() {
  const { token } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!token) return;
    try {
      const [list, count] = await Promise.all([
        notificationsApi.list(token, false, 20) as Promise<Notification[]>,
        notificationsApi.unreadCount(token),
      ]);
      setItems(list);
      setUnread(count.count);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const markRead = async (id: string) => {
    if (!token) return;
    await notificationsApi.markRead(token, id);
    setItems((p) => p.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await notificationsApi.markAllRead(token);
      setItems((p) => p.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold text-white ring-2 ring-background">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAll} disabled={loading} className="h-7 px-2 text-xs">
              <Check className="h-3 w-3 mr-1" /> Mark all
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[360px]">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex flex-col items-start gap-1 cursor-pointer py-2"
                onClick={() => {
                  if (!n.is_read) markRead(n.id);
                  if (n.link_url) window.location.href = n.link_url;
                }}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="text-sm font-medium leading-tight">{n.title}</span>
                  {!n.is_read && <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">new</Badge>}
                </div>
                {n.body && <span className="text-xs text-muted-foreground line-clamp-2">{n.body}</span>}
                <span className="text-[10px] text-muted-foreground/70">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
