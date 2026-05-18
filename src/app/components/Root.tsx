import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  Facebook,
  Instagram,
  ShoppingCart,
  User,
} from "lucide-react";
import { useState, } from "react";
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

export function Root() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const { items } = useCart();
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();


  const handleLogout = async () => {
  await logout();

  setIsMenuOpen(false);
  setIsProfileOpen(false);
  setIsLogoutDialogOpen(false);

  navigate("/login", { replace: true });
};

  const isAdminDashboard = location.pathname.startsWith("/dashboard/admin");

  const cartItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f9f7f4] text-stone-800">

      {/* HEADER */}
      {!isAdminDashboard && (
        <header className="sticky top-0 z-[9999] relative border-b border-stone-200/60 bg-[#f9f7f4]/70 backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-24">

              {/* BRAND */}
              <Link to="/" className="flex items-center gap-2">
                <img src={logo} className="h-20 w-auto" />
                <span className="font-semibold">Sahgil Garden Set</span>
              </Link>

              {/* NAV */}
              <nav className="hidden md:flex gap-10">
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <Link to="/services">Services</Link>
                <Link to="/contact">Contact</Link>
              </nav>

              {/* ACTIONS */}
<div className="flex items-center gap-3 relative z-[10000]">

  {role === "customer" && (
    <button
  onClick={() => setIsCartOpen(true)}
  className="relative z-[10001] p-2 rounded-lg hover:bg-stone-200 transition cursor-pointer pointer-events-auto"
> 
      <ShoppingCart className="w-6 h-6" />

      {cartItemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5">
          {cartItemCount}
        </span>
      )}
    </button>
  )}

  {user && (
    <div className="pointer-events-auto">
      <NotificationBell userId={user.uid} />
    </div>
  )}

  {!user && (
    <Link to="/login" className="hidden md:block pointer-events-auto">
      Login
    </Link>
  )}

  {user && (
    <button
  onClick={() => setIsProfileOpen(true)}
  className="relative z-[10001] p-2 rounded-lg hover:bg-stone-200 transition cursor-pointer pointer-events-auto"
>
      <User className="w-6 h-6" />
    </button>
  )}

  <button
    onClick={() => setIsMenuOpen(true)}
    className="relative z-[10001] md:hidden p-2 rounded-lg hover:bg-stone-200 transition cursor-pointer"
  >
    <Menu className="w-6 h-6" />
  </button>

</div>

            </div>
          </div>
        </header>
      )}

      {/* CONTENT */}
      <main className="flex-grow relative z-0">
  <AnimatePresence mode="wait">
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "relative", zIndex: 0 }}
    >
      <Outlet />
    </motion.div>
  </AnimatePresence>
</main>

      {/* FOOTER FIXED */}
      {!isAdminDashboard && (
        <footer className="bg-stone-900 text-stone-300 py-12">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">

            <div>
              <h3 className="text-white font-semibold">Sahgil Garden Set</h3>
              <p className="text-sm text-stone-400">
                Landscaping & garden furniture services.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold">Links</h3>
              <div className="flex flex-col gap-2 text-sm">
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <Link to="/services">Services</Link>
                <Link to="/contact">Contact</Link>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold">Contact</h3>

              <p className="text-sm text-stone-400">Quezon City</p>

              <div className="flex gap-4 mt-3">

                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook />
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram />
                </a>

              </div>
            </div>

          </div>
        </footer>
      )}

{/* CART SHEET */}
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

{/* PROFILE SHEET */}
<Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
  <SheetContent side="right" className="w-full sm:max-w-sm">
    <SheetHeader>
      <SheetTitle>My Profile</SheetTitle>
    </SheetHeader>

    <div className="mt-6 flex flex-col gap-6">

      {/* USER INFO */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-100">
        <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">
          {user?.email?.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-stone-900 truncate">
            {user?.displayName || "Customer"}
          </p>

          <p className="text-sm text-stone-500 truncate">
            {user?.email}
          </p>

          <p className="text-xs text-emerald-700 mt-1 capitalize">
            {role}
          </p>
        </div>
      </div>

      {/* MENU */}
      <div className="flex flex-col gap-2">

        <button
  onClick={() => {
    navigate("/profile");
    setIsProfileOpen(false);
  }}
  className="w-full text-left px-4 py-3 rounded-xl hover:bg-stone-100 transition"
>
  My Profile
</button> 

        <button
          onClick={() => {
            navigate("/dashboard/customer");
            setIsProfileOpen(false);
          }}
          className="w-full text-left px-4 py-3 rounded-xl hover:bg-stone-100 transition"
        >
          Dashboard
        </button>

        <button
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

      {/* LOGOUT DIALOG */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}