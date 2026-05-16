import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { Leaf, Menu, Facebook, Instagram, ShoppingCart, User, LogOut } from "lucide-react";
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
          if (userRole === "admin" && !location.pathname.startsWith("/dashboard/admin")) {
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
    const auth = getAuth();
    await signOut(auth);
    setUser(null);
    navigate("/");
    setIsProfileOpen(false);
  };

  const isAdminDashboard = location.pathname.startsWith("/dashboard/admin");
  const cartItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const navLinks = (
    <>
      {role !== "admin" && (
        <>
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="block py-2 text-stone-700 hover:text-emerald-600">Home</Link>
          <Link to="/about" onClick={() => setIsMenuOpen(false)} className="block py-2 text-stone-700 hover:text-emerald-600">About</Link>
          <Link to="/services" onClick={() => setIsMenuOpen(false)} className="block py-2 text-stone-700 hover:text-emerald-600">Services</Link>
          <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="block py-2 text-stone-700 hover:text-emerald-600">Contact</Link>
        </>
      )}
      {role === "customer" && (
        <Link to="/dashboard/customer" onClick={() => setIsMenuOpen(false)} className="block py-2 text-stone-700 hover:text-emerald-600">Dashboard</Link>
      )}
      {role === "admin" && (
        <Link to="/dashboard/admin" onClick={() => setIsMenuOpen(false)} className="block py-2 text-stone-700 hover:text-emerald-600">Admin</Link>
      )}
      {user ? (
        <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="block py-2 text-red-600 hover:text-red-700 w-full text-left">
          Logout
        </button>
      ) : (
        <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block py-2 text-stone-700 hover:text-emerald-600">Login</Link>
      )}
    </>
  );


  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f9f7f4] text-stone-800">
      {/* Header (Customer/General) */}
      {!isAdminDashboard && (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-stone-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 md:h-20">
              {/* Brand */}
              <Link to="/" className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg" aria-label="Home">
                <div className="bg-emerald-600 p-2 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                  <Leaf className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <span className="text-xl font-bold text-emerald-900 hidden sm:inline">Sahgil Garden Set</span>
                <span className="text-lg font-bold text-emerald-900 sm:hidden">Sahgil</span>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
                {role !== "admin" && (
                  <>
                    <Link to="/" className="hover:text-emerald-600 transition-colors font-medium px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Home</Link>
                    <Link to="/about" className="hover:text-emerald-600 transition-colors font-medium px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">About</Link>
                    <Link to="/services" className="hover:text-emerald-600 transition-colors font-medium px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Services</Link>
                    <Link to="/contact" className="hover:text-emerald-600 transition-colors font-medium px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Contact</Link>
                  </>
                )}
                {role === "customer" && (
                  <Link to="/dashboard/customer" className="hover:text-emerald-600 transition-colors font-medium px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Dashboard</Link>
                )}
                {role === "admin" && (
                  <Link to="/dashboard/admin" className="hover:text-emerald-600 transition-colors font-medium px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Admin</Link>
                )}
                {user ? (
                  <button onClick={handleLogout} className="text-red-600 hover:text-red-700 transition-colors font-medium px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">Logout</button>
                ) : (
                  <Link to="/login" className="hover:text-emerald-600 transition-colors font-medium px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Login</Link>
                )}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {role === "customer" && (
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-2 text-stone-700 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
                    aria-label="Open cart"
                  >
                    <ShoppingCart className="w-6 h-6" aria-hidden="true" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                )}
                {user && <NotificationBell userId={user.uid} />}
                {user && (
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="p-2 text-stone-700 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
                    aria-label="Account menu"
                  >
                    <User className="w-6 h-6" aria-hidden="true" />
                  </button>
                )}
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="md:hidden p-2 text-stone-700 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Menu Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="right" className="w-[280px] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle className="text-emerald-900">Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2 mt-6">
            {navLinks}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="w-[320px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="text-emerald-900">Your Cart</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex-1 overflow-y-auto">
            <Cart />
          </div>
        </SheetContent>
      </Sheet>

      {/* Profile Sheet */}
      <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <SheetContent side="right" className="w-[280px] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle className="text-emerald-900">Account</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 mt-6">
            <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 text-stone-700">
              <User className="w-5 h-5" />
              My Profile
            </Link>
            {role === "customer" && (
              <Link to="/dashboard/customer" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 text-stone-700">
                <Leaf className="w-5 h-5" />
                Dashboard
              </Link>
            )}
            <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-600 w-full text-left">
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </SheetContent>
      </Sheet>

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

      {/* Footer */}
      {!isAdminDashboard && (
        <footer className="bg-stone-900 text-stone-300 py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-emerald-600 p-1.5 rounded-lg">
                    <Leaf className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-white">Sahgil Garden Set</span>
                </div>
                <p className="text-sm text-stone-400 leading-relaxed">
                  Premium outdoor furniture and expert landscaping services to transform your garden into a dream space.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link></li>
                  <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About</Link></li>
                  <li><Link to="/services" className="hover:text-emerald-400 transition-colors">Services</Link></li>
                  <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Follow Us</h4>
                <div className="flex items-center gap-4">
                  <a href="#" className="hover:text-emerald-400 transition-colors"><Facebook className="w-5 h-5" /></a>
                  <a href="#" className="hover:text-emerald-400 transition-colors"><Instagram className="w-5 h-5" /></a>
                </div>
                <p className="mt-4 text-xs text-stone-500">
                  © {new Date().getFullYear()} Sahgil Garden Set. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}

