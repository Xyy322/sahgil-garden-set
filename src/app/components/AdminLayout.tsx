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
      <div className="p-6 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-bold text-white">
            A
          </div>
          <div>
            <h1 className="font-bold text-xl text-stone-900">Admin Portal</h1>
            <p className="text-sm text-stone-500">Manage business</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
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
              className={`w-full justify-start h-12 gap-3 font-medium ${
                isActive
                  ? "bg-stone-50 text-stone-900 border-r-2 border-emerald-600"
                  : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
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

      <div className="p-4 border-t border-stone-100">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-stone-600 hover:text-stone-900 hover:bg-stone-50"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Log out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f9f7f4] flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-white border-r border-stone-200 shadow-sm flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <div className="flex flex-col h-full">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <div className="bg-stone-900 text-white px-4 md:px-6 py-4 shadow-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 text-stone-300 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Quick search..."
                className="w-full bg-stone-800 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

