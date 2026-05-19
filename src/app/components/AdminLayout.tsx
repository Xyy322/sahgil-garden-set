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
  const { logout, role } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
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
      <div className="p-6 border-b border-stone-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 font-bold text-white shadow-sm">
            A
          </div>

          <div>
            <h1 className="font-bold text-xl text-stone-900">Admin Portal</h1>
            <p className="text-sm text-stone-500">
              Manage business operations
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
              <Icon className="w-5 h-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-200 bg-white">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-3 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Log out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-stone-200 bg-white/95 shadow-sm backdrop-blur">
        <SidebarContent />
      </aside>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
  <SheetContent side="left" className="w-[280px] p-0 bg-white">
    <SheetTitle className="sr-only">Admin navigation menu</SheetTitle>

    <div className="flex flex-col h-full">
      <SidebarContent />
    </div>
  </SheetContent>
</Sheet>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 px-4 py-4 text-stone-900 shadow-sm backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="md:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100"
                aria-label="Open admin menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div>
                <p className="text-sm font-semibold text-stone-900">
                  Admin Dashboard
                </p>
                <p className="text-xs text-stone-500 hidden sm:block">
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