import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  Facebook,
  Instagram,
  ShoppingCart,
  User,
  Home,
  Info,
  Phone,
  Leaf,
  LayoutDashboard,
  LogIn,
  UserPlus,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useCart } from "./CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Cart } from "./Cart";
import { AnimatePresence, motion } from "framer-motion";
import { NotificationBell } from "./notifications/NotificationBell";
import logo from "../../assets/logo.png";

const publicLinks = [
  {
    label: "Home",
    path: "/",
    icon: Home,
  },
  {
    label: "About",
    path: "/about",
    icon: Info,
  },
  {
    label: "Services",
    path: "/services",
    icon: Leaf,
  },
  {
    label: "Contact",
    path: "/contact",
    icon: Phone,
  },
];

export function Root() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const { items } = useCart();
  const { user, role, profile, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const isAdminDashboard = location.pathname.startsWith("/dashboard/admin");

  const cartItemCount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const dashboardPath =
    role === "admin" ? "/dashboard/admin" : "/dashboard/customer";

  const displayName =
    profile?.fullName || user?.displayName || user?.email?.split("@")[0] || "User";

  const handleLogout = async () => {
    await logout();

    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setIsLogoutDialogOpen(false);

    navigate("/login", { replace: true });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f9f7f4] text-stone-800">
      {!isAdminDashboard && (
        <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[#f9f7f4]/90 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20 md:h-24">
              <Link
                to="/"
                className="flex items-center gap-2 min-w-0"
                aria-label="Go to home page"
              >
                <img
                  src={logo}
                  alt="Sahgil Garden Set logo"
                  className="h-14 md:h-20 w-auto shrink-0"
                />
                <span className="hidden sm:block font-semibold text-stone-900 truncate">
                  Sahgil Garden Set
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-8">
                {publicLinks.map((link) => {
                  const isActive =
                    link.path === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(link.path);

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`text-sm font-medium transition-colors ${
                        isActive
                          ? "text-emerald-700"
                          : "text-stone-700 hover:text-emerald-700"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-2 sm:gap-3">
                {role === "customer" && (
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-2 rounded-xl text-stone-700 hover:bg-stone-200/80 hover:text-emerald-700 transition"
                    aria-label="Open cart"
                  >
                    <ShoppingCart className="w-6 h-6" />

                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold min-w-5 h-5 px-1 flex items-center justify-center rounded-full">
                        {cartItemCount > 99 ? "99+" : cartItemCount}
                      </span>
                    )}
                  </button>
                )}

                {user && role && (
                  <NotificationBell
                    userId={role === "admin" ? "admin" : user.uid}
                    role={role}
                  />
                )}

                {!user && (
                  <Link
                    to="/login"
                    className="hidden md:inline-flex px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
                  >
                    Login
                  </Link>
                )}

                {user && (
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(true)}
                    className="p-2 rounded-xl text-stone-700 hover:bg-stone-200/80 hover:text-emerald-700 transition"
                    aria-label="Open profile menu"
                  >
                    <User className="w-6 h-6" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsMenuOpen(true)}
                  className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-200/80 hover:text-emerald-700 transition"
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="flex-grow relative z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="relative z-0"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {!isAdminDashboard && (
        <footer className="bg-stone-900 text-stone-300 py-10 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-white font-semibold">Sahgil Garden Set</h3>
              <p className="mt-2 text-sm text-stone-400 leading-relaxed">
                Landscaping and garden furniture services for outdoor living.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold">Links</h3>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                {publicLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="hover:text-white transition"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold">Contact</h3>
              <p className="mt-3 text-sm text-stone-400">Quezon City</p>

              <div className="flex gap-4 mt-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-[300px] p-0 bg-[#f9f7f4]">
          <SheetHeader className="p-5 border-b border-stone-200 text-left">
            <SheetTitle className="flex items-center gap-3">
              <img
                src={logo}
                alt="Sahgil Garden Set logo"
                className="h-12 w-auto"
              />
              <span>Sahgil Garden Set</span>
            </SheetTitle>
          </SheetHeader>

          <div className="p-4 space-y-6">
            <nav className="space-y-2">
              {publicLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => handleNavigate(link.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-stone-700 hover:bg-stone-200/70 transition"
                  >
                    <Icon className="w-5 h-5 text-emerald-700" />
                    {link.label}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-stone-200 pt-4 space-y-2">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavigate(dashboardPath)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-stone-700 hover:bg-stone-200/70 transition"
                  >
                    <LayoutDashboard className="w-5 h-5 text-emerald-700" />
                    Dashboard
                  </button>

                  {role === "customer" && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsCartOpen(true);
                      }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left font-medium text-stone-700 hover:bg-stone-200/70 transition"
                    >
                      <span className="flex items-center gap-3">
                        <ShoppingCart className="w-5 h-5 text-emerald-700" />
                        Cart
                      </span>

                      {cartItemCount > 0 && (
                        <span className="rounded-full bg-red-600 text-white text-xs px-2 py-0.5">
                          {cartItemCount}
                        </span>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleNavigate("/profile")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-stone-700 hover:bg-stone-200/70 transition"
                  >
                    <User className="w-5 h-5 text-emerald-700" />
                    My Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsLogoutDialogOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/login")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-stone-700 hover:bg-stone-200/70 transition"
                  >
                    <LogIn className="w-5 h-5 text-emerald-700" />
                    Login
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavigate("/register")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-stone-700 hover:bg-stone-200/70 transition"
                  >
                    <UserPlus className="w-5 h-5 text-emerald-700" />
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            <Cart />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Account</SheetTitle>
          </SheetHeader>

          <div className="mt-6 flex flex-col gap-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-100">
              <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-stone-900 truncate">
                  {displayName}
                </p>

                <p className="text-sm text-stone-500 truncate">{user?.email}</p>

                <p className="text-xs text-emerald-700 mt-1 capitalize">
                  {role || "User"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {role === "customer" && (
                <button
                  type="button"
                  onClick={() => handleNavigate("/profile")}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-stone-100 transition"
                >
                  My Profile
                </button>
              )}

              <button
                type="button"
                onClick={() => handleNavigate(dashboardPath)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-stone-100 transition"
              >
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsLogoutDialogOpen(true);
                }}
                className="w-full text-left px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}