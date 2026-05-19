import { useState, type ComponentType } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Package,
  PackageSearch,
  CalendarCheck,
  LogOut,
  MessageSquare,
  Menu,
  BarChart3,
  UsersRound,
  Star,
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTitle } from "./ui/sheet";
import { NotificationBell } from "./notifications/NotificationBell";

type AdminNavItem = {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { logout, role } = useAuth();

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsMenuOpen(false);

      navigate("/login", {
        replace: true,
        state: null,
      });

      setIsLoggingOut(false);
    }
  };

  const navItems: AdminNavItem[] = [
    {
      path: "/dashboard/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      path: "/dashboard/admin/products",
      label: "Products",
      icon: Package,
    },
    {
      path: "/dashboard/admin/orders",
      label: "Orders",
      icon: PackageSearch,
    },
    {
      path: "/dashboard/admin/appointments",
      label: "Appointments",
      icon: CalendarCheck,
    },
    {
      path: "/dashboard/admin/inquiries",
      label: "Inquiries",
      icon: MessageSquare,
    },
    {
      path: "/dashboard/admin/reviews",
      label: "Reviews",
      icon: Star,
    },
    {
      path: "/dashboard/admin/reports",
      label: "Reports",
      icon: BarChart3,
    },
    {
      path: "/dashboard/admin/users",
      label: "Customer Records",
      icon: UsersRound,
    },
  ];

  const activePath = location.pathname;

  const SidebarContent = () => (
    <>
      <div className="border-b border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 font-bold text-white shadow-sm">
            A
          </div>

          <div>
            <h1 className="text-xl font-bold text-stone-900">Admin Portal</h1>
            <p className="text-sm text-stone-500">
              Manage business operations
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.path === "/dashboard/admin"
              ? activePath === "/dashboard/admin"
              : activePath.startsWith(item.path);

          return (
            <Button
              key={item.path}
              type="button"
              variant="ghost"
              className={`h-12 w-full justify-start gap-3 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                  : "text-stone-700 hover:-translate-y-0.5 hover:bg-stone-100 hover:text-stone-900"
              }`}
              onClick={() => {
                navigate(item.path);
                setIsMenuOpen(false);
              }}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="border-t border-stone-200 bg-white p-4">
        <Button
          type="button"
          variant="ghost"
          disabled={isLoggingOut}
          className="w-full justify-start gap-3 rounded-xl text-stone-600 hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-stone-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white/95 shadow-sm backdrop-blur md:flex">
        <SidebarContent />
      </aside>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-[280px] bg-white p-0">
          <SheetTitle className="sr-only">Admin navigation menu</SheetTitle>

          <div className="flex h-full flex-col">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 px-4 py-4 text-stone-900 shadow-sm backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 md:hidden"
                aria-label="Open admin menu"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div>
                <p className="text-sm font-semibold text-stone-900">
                  Admin Dashboard
                </p>
                <p className="hidden text-xs text-stone-500 sm:block">
                  Sahgil Garden Furniture Trading
                </p>
              </div>
            </div>

            {role === "admin" && (
              <NotificationBell userId="admin" role="admin" />
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gradient-to-b from-stone-50 to-emerald-50/30 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}