import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router";
import { getAuth, signOut } from "firebase/auth";
import {
  LayoutDashboard,
  Package,
  PackageSearch,
  CalendarCheck,
  LogOut,
  Search,
  MessageSquare,
  Menu,
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent } from "./ui/sheet";

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(getAuth());
    navigate("/login", { replace: true });
  };

  const navItems = [
    { path: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/admin/products", label: "Products", icon: Package },
    { path: "/dashboard/admin/orders", label: "Orders", icon: PackageSearch },
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
  ];

  const activePath = location.pathname;

  const SidebarContent = () => (
    <>
      {/* HEADER */}
      <div className="p-6 border-b border-stone-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-bold text-white">
            A
          </div>
          <div>
            <h1 className="font-bold text-xl text-stone-900">
              Admin Portal
            </h1>
            <p className="text-sm text-stone-500">
              Manage business operations
            </p>
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.path === "/dashboard/admin"
              ? activePath === "/dashboard/admin"
              : activePath.startsWith(item.path);

          return (
            <Button
              key={item.path}
              variant="ghost"
              className={`w-full justify-start h-12 gap-3 font-medium rounded-xl transition-colors ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
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

      {/* FOOTER */}
      <div className="p-4 border-t border-stone-200 bg-white">
        <Button
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
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex w-64 bg-white border-r border-stone-200 shadow-sm flex-col">
        <SidebarContent />
      </div>

      {/* MOBILE SIDEBAR */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-white">
          <div className="flex flex-col h-full">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* TOP BAR */}
        <div className="bg-white text-stone-900 px-4 md:px-6 py-4 border-b border-stone-200 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Quick search..."
                className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-stone-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}