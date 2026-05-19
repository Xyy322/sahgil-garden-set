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
    profile?.fullName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";

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
    <div className="flex min-h-screen flex-col bg-[#f9f7f4] font-sans text-stone-800">
      {!isAdminDashboard && (
        <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 shadow-sm backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between md:h-24">
              <Link
                to="/"
                className="group flex min-w-0 items-center gap-3"
                aria-label="Go to home page"
              >
                <img
                  src={logo}
                  alt="Sahgil Garden Set logo"
                  className="h-11 w-auto shrink-0 transition-transform duration-300 group-hover:scale-105 md:h-20"
                />

                <div className="hidden min-w-0 flex-col sm:flex">
                  <span className="truncate text-lg font-bold text-stone-900 md:text-xl">
                    Sahgil Garden Set
                  </span>
                  <span className="hidden text-xs font-medium uppercase tracking-wide text-emerald-700 md:block">
                    Garden Furniture & Landscaping
                  </span>
                </div>
              </Link>

              <nav className="hidden items-center gap-2 md:flex">
                {publicLinks.map((link) => {
                  const isActive =
                    link.path === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(link.path);

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      aria-current={isActive ? "page" : undefined}
                      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 shadow-sm"
                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-1.5 md:gap-2">
                {role === "customer" && (
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="button-press relative hidden h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md md:flex"
                    aria-label="Open cart"
                  >
                    <ShoppingCart className="h-5 w-5" />

                    {cartItemCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                        {cartItemCount > 99 ? "99+" : cartItemCount}
                      </span>
                    )}
                  </button>
                )}

                {user && role && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-100 md:h-11 md:w-11 md:border md:border-stone-200 md:bg-white md:shadow-sm md:hover:-translate-y-0.5 md:hover:bg-emerald-50 md:hover:text-emerald-700 md:hover:shadow-md">
                    <NotificationBell
                      userId={role === "admin" ? "admin" : user.uid}
                      role={role}
                    />
                  </div>
                )}

                {!user && (
                  <Link
                    to="/login"
                    className="button-press hidden rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md md:inline-flex"
                  >
                    Login
                  </Link>
                )}

                {user && (
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(true)}
                    className="button-press hidden h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md md:flex"
                    aria-label="Open profile menu"
                  >
                    <User className="h-5 w-5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsMenuOpen(true)}
                  className="button-press flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-100 hover:text-emerald-700 md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="relative z-0 flex-grow">
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
        <footer className="bg-stone-900 py-10 text-stone-300 md:py-12">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            <div>
              <h3 className="font-semibold text-white">Sahgil Garden Set</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">
                Landscaping and garden furniture services for outdoor living.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white">Links</h3>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                {publicLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white">Contact</h3>
              <p className="mt-3 text-sm text-stone-400">
                Barangay Lumil, Silang, Cavite
              </p>

              <div className="mt-4 flex gap-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-[300px] bg-[#f9f7f4] p-0">
          <SheetHeader className="border-b border-stone-200 p-5 text-left">
            <SheetTitle className="flex items-center gap-3">
              <img
                src={logo}
                alt="Sahgil Garden Set logo"
                className="h-12 w-auto"
              />
              <span>Sahgil Garden Set</span>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 p-4">
            <nav className="space-y-2">
              {publicLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(link.path);

                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => handleNavigate(link.path)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-stone-700 hover:bg-stone-200/70"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-emerald-700" />
                    {link.label}
                  </button>
                );
              })}
            </nav>

            <div className="space-y-2 border-t border-stone-200 pt-4">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavigate(dashboardPath)}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-stone-700 transition hover:bg-stone-200/70"
                  >
                    <LayoutDashboard className="h-5 w-5 text-emerald-700" />
                    Dashboard
                  </button>

                  {role === "customer" && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsCartOpen(true);
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left font-medium text-stone-700 transition hover:bg-stone-200/70"
                    >
                      <span className="flex items-center gap-3">
                        <ShoppingCart className="h-5 w-5 text-emerald-700" />
                        Cart
                      </span>

                      {cartItemCount > 0 && (
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                          {cartItemCount}
                        </span>
                      )}
                    </button>
                  )}

                  {role === "customer" && (
                    <button
                      type="button"
                      onClick={() => handleNavigate("/profile")}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-stone-700 transition hover:bg-stone-200/70"
                    >
                      <User className="h-5 w-5 text-emerald-700" />
                      My Profile
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsLogoutDialogOpen(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/login")}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-stone-700 transition hover:bg-stone-200/70"
                  >
                    <LogIn className="h-5 w-5 text-emerald-700" />
                    Login
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavigate("/register")}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-stone-700 transition hover:bg-stone-200/70"
                  >
                    <UserPlus className="h-5 w-5 text-emerald-700" />
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-lg"
        >
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
            <div className="flex items-center gap-4 rounded-2xl bg-stone-100 p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold text-stone-900">
                  {displayName}
                </p>

                <p className="truncate text-sm text-stone-500">{user?.email}</p>

                <p className="mt-1 text-xs capitalize text-emerald-700">
                  {role || "User"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {role === "customer" && (
                <button
                  type="button"
                  onClick={() => handleNavigate("/profile")}
                  className="w-full rounded-xl px-4 py-3 text-left transition hover:bg-stone-100"
                >
                  My Profile
                </button>
              )}

              <button
                type="button"
                onClick={() => handleNavigate(dashboardPath)}
                className="w-full rounded-xl px-4 py-3 text-left transition hover:bg-stone-100"
              >
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsLogoutDialogOpen(true);
                }}
                className="w-full rounded-xl px-4 py-3 text-left text-red-600 transition hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
      >
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