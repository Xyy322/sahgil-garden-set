import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { Button } from "../ui/button";

interface NotificationBellProps {
  userId: string;
  role?: "admin" | "customer" | null;
}

export function NotificationBell({ userId, role = "customer" }: NotificationBellProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } =
    useNotifications(userId);

  const latestNotifications = useMemo(
    () => notifications.slice(0, 10),
    [notifications]
  );

  const resolvePath = (type: string) => {
    if (role === "admin") {
      if (type === "order") return "/dashboard/admin/orders";
      if (type === "appointment") return "/dashboard/admin/appointments";
      if (type === "inquiry") return "/dashboard/admin/inquiries";
      return "/dashboard/admin";
    }

    if (type === "order") return "/dashboard/customer";
    if (type === "appointment") return "/dashboard/customer";
    if (type === "inquiry") return "/dashboard/customer/inquiries";

    return "/dashboard/customer";
  };

  const handleNotificationClick = async (
    id: string,
    type: string,
    statusRefId?: string
  ) => {
    await markAsRead(id);
    setOpen(false);
    navigate(resolvePath(type), {
      state: statusRefId ? { focusId: statusRefId } : undefined,
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 text-stone-700 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className="w-6 h-6" aria-hidden="true" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold min-w-5 h-5 px-1 flex items-center justify-center rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[92vw] bg-white border border-stone-200 rounded-xl shadow-xl z-50 animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-stone-100">
            <p className="font-semibold text-stone-900 text-base">
              Notifications
            </p>

            <Button
              size="sm"
              variant="outline"
              onClick={markAllAsRead}
              className="h-8 text-xs"
              aria-label="Mark all as read"
            >
              Mark all read
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-stone-100">
            {loading ? (
              <div className="p-5 text-sm text-stone-500">
                Loading notifications...
              </div>
            ) : latestNotifications.length === 0 ? (
              <div className="p-5 text-sm text-stone-500">
                No notifications yet.
              </div>
            ) : (
              latestNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() =>
                    handleNotificationClick(
                      notification.id,
                      notification.type,
                      notification.statusRefId
                    )
                  }
                  className={`w-full text-left px-4 py-3 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-none ${
                    notification.read
                      ? "bg-white text-stone-700"
                      : "bg-emerald-50/60 text-emerald-900 font-semibold border-l-4 border-emerald-400"
                  }`}
                  aria-label={notification.title || "Notification"}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold truncate">
                      {notification.title || "Notification"}
                    </span>

                    <span className="text-xs text-stone-600 mt-0.5 line-clamp-2">
                      {notification.message || "You have a new update."}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}