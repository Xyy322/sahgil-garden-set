import { Outlet, Link, useNavigate, useLocation } from "react-router";
import {
  Leaf,
  Menu,
  Facebook,
  Instagram,
  ShoppingCart,
  User,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../utils/firebase/config";
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

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<"admin" | "customer" | null>(null);

  const { items } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setRole(null);
        return;
      }

      try {
        const uidSnap = await getDoc(doc(db, "users", firebaseUser.uid));

        if (uidSnap.exists()) {
          const data = uidSnap.data() as { role?: "admin" | "customer" };
          const userRole = data.role ?? null;
          setRole(userRole);

          if (
            userRole === "admin" &&
            !location.pathname.startsWith("/dashboard/admin")
          ) {
            navigate("/dashboard/admin", { replace: true });
          }
        } else {
          setRole(null);
        }
      } catch {
        setRole(null);
      }
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
  const confirmLogout = window.confirm("Are you sure you want to log out?");
  if (!confirmLogout) return;

  const auth = getAuth();
  await signOut(auth);
  setUser(null);
  setIsProfileOpen(false);
  navigate("/");
};

  const isAdminDashboard = location.pathname.startsWith("/dashboard/admin");

  const cartItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f9f7f4] text-stone-800">

      {/* HEADER (RESTORED OLD LOOK & BEHAVIOR) */}
      {!isAdminDashboard && (
        <header className="sticky top-0 z-50 border-b border-stone-200/60 bg-[#f9f7f4]/70 backdrop-blur-2xl">
  <div className="max-w-7xl mx-auto px-6 lg:px-8">
    
    <div className="flex items-center justify-between h-24">

      {/* LEFT: BRAND */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
  <img
    src={logo}
    alt="Sahgil Garden Set"
    className="h-10 w-auto object-contain"
  />
  <span className="text-lg font-semibold leading-none tracking-tight">
    Sahgil Garden Set
  </span>
</Link>

      {/* CENTER: NAV */}
      <nav className="hidden md:flex justify-center items-center gap-10">
        {role !== "admin" && (
          <>
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/services" className="nav-link">Services</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
          </>
        )}

        {role === "customer" && (
          <Link to="/dashboard/customer" className="nav-link">
            Dashboard
          </Link>
        )}

        {role === "admin" && (
          <Link to="/dashboard/admin" className="nav-link">
            Admin
          </Link>
        )}
      </nav>

      {/* RIGHT: ACTIONS */}
      <div className="flex justify-end items-center gap-2">

        {role === "customer" && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="icon-button relative"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="cart-badge">
                {cartItemCount}
              </span>
            )}
          </button>
        )}
        {!user && (
  <Link
    to="/login"
    className="
      px-4 py-2 
      rounded-full 
      bg-emerald-600 
      text-white 
      text-sm 
      font-medium
      hover:bg-emerald-700 
      transition-all 
      shadow-sm
      hidden md:flex
    "
  >
    Login
  </Link>
)}


        {user && <NotificationBell userId={user.uid} />}

        <button
          onClick={() => setIsMenuOpen(true)}
          className="icon-button md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        {user && (
  <button
    onClick={() => setIsProfileOpen(true)}
    className="icon-button hidden md:flex"
    aria-label="Open profile"
  >
    <User className="w-5 h-5" />
  </button>
)}
      </div>

    </div>
  </div>
</header>
      )}

      {/* MOBILE MENU */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="right" className="w-[300px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-2 mt-6">
            {role !== "admin" && (
              <>
                <Link onClick={() => setIsMenuOpen(false)} to="/" className="px-3 py-2 hover:bg-stone-100 rounded-md">Home</Link>
                <Link onClick={() => setIsMenuOpen(false)} to="/about" className="px-3 py-2 hover:bg-stone-100 rounded-md">About</Link>
                <Link onClick={() => setIsMenuOpen(false)} to="/services" className="px-3 py-2 hover:bg-stone-100 rounded-md">Services</Link>
                <Link onClick={() => setIsMenuOpen(false)} to="/contact" className="px-3 py-2 hover:bg-stone-100 rounded-md">Contact</Link>
              </>
            )}

            {role === "customer" && (
              <Link onClick={() => setIsMenuOpen(false)} to="/dashboard/customer" className="px-3 py-2 hover:bg-stone-100 rounded-md">
                Dashboard
              </Link>
            )}

            {role === "admin" && (
              <Link onClick={() => setIsMenuOpen(false)} to="/dashboard/admin" className="px-3 py-2 hover:bg-stone-100 rounded-md">
                Admin Dashboard
              </Link>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                className="mt-4 bg-red-600 text-white py-2 rounded-full"
              >
                Logout
              </button>
            ) : (
              <Link
                onClick={() => setIsMenuOpen(false)}
                to="/login"
                className="mt-4 bg-emerald-600 text-white py-2 rounded-full text-center"
              >
                Login
              </Link>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* CART */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Cart</SheetTitle>
          </SheetHeader>
          <Cart />
        </SheetContent>
      </Sheet>

      {/* PROFILE */}
      <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Account</SheetTitle>
          </SheetHeader>

          <div className="mt-6 flex flex-col gap-4">
            <Link to="/profile" onClick={() => setIsProfileOpen(false)}>
              My Profile
            </Link>

            {role === "customer" && (
              <Link to="/dashboard/customer" onClick={() => setIsProfileOpen(false)}>
                Dashboard
              </Link>
            )}

            <button onClick={handleLogout} className="text-left text-red-600">
              Logout
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* PAGE CONTENT */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER (UNCHANGED STYLE) */}
      {!isAdminDashboard && (
        <footer className="bg-stone-900 text-stone-300 py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-center text-sm">
              © {new Date().getFullYear()} Sahgil Garden Set
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}