import { useState } from "react";
import { useLocation } from "wouter";
import { Bell, BellRing, Check, UserPlus, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetUnreadNotificationCount,
  useListNotifications,
  useMarkAllNotificationsRead,
  getGetUnreadNotificationCountQueryKey,
  getListNotificationsQueryKey,
  type Notification,
} from "@workspace/api-client-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePushNotifications } from "@/hooks/usePushNotifications";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const secs = Math.floor((Date.now() - then) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function TypeIcon({ type }: { type: string }) {
  if (type === "request_approved") {
    return <CheckCircle2 className="h-4 w-4 text-primary" />;
  }
  return <UserPlus className="h-4 w-4 text-primary" />;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const push = usePushNotifications();

  const { data: unread } = useGetUnreadNotificationCount({
    query: {
      queryKey: getGetUnreadNotificationCountQueryKey(),
      refetchInterval: 30000,
      refetchOnWindowFocus: true,
    },
  });
  const { data: notifications, isLoading } = useListNotifications({
    query: { queryKey: getListNotificationsQueryKey(), enabled: open },
  });

  const markAllRead = useMarkAllNotificationsRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      },
    },
  });

  const unreadCount = unread?.count ?? 0;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && unreadCount > 0) {
      markAllRead.mutate();
    }
  }

  function handleClick(n: Notification) {
    setOpen(false);
    if (n.eventId != null) {
      setLocation(`/events/${n.eventId}`);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 rounded-2xl p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">{unreadCount} new</span>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</div>
          )}

          {!isLoading && (!notifications || notifications.length === 0) && (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">You're all caught up</p>
              <p className="text-xs text-muted-foreground">No notifications yet.</p>
            </div>
          )}

          {!isLoading &&
            notifications?.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted ${
                  n.read ? "" : "bg-primary/5"
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={n.actorAvatar || ""} className="object-cover" />
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                      {n.actorName?.charAt(0)?.toUpperCase() || <TypeIcon type={n.type} />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background">
                    <TypeIcon type={n.type} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground leading-snug">{n.title}</p>
                  {n.body && (
                    <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </button>
            ))}
        </div>

        {push.status !== "unsupported" && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="px-4 py-3">
              {push.status === "subscribed" ? (
                <button
                  onClick={() => push.disable()}
                  className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span className="flex items-center gap-1.5">
                    <BellRing className="h-3.5 w-3.5 text-primary" />
                    Push notifications on
                  </span>
                  <Check className="h-3.5 w-3.5 text-primary" />
                </button>
              ) : push.status === "denied" ? (
                <p className="text-xs text-muted-foreground">
                  Push is blocked in your browser settings.
                </p>
              ) : (
                <button
                  onClick={() => push.enable()}
                  disabled={push.status === "loading"}
                  className="flex w-full items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-60"
                >
                  <BellRing className="h-3.5 w-3.5" />
                  {push.status === "loading" ? "Enabling…" : "Enable push notifications"}
                </button>
              )}
              {push.error && <p className="mt-1 text-[11px] text-destructive">{push.error}</p>}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
