import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../utils/firebase/config";

type Role = "admin" | "customer";

export function RoleProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuth(false);
        setRole(null);
        setLoading(false);
        return;
      }

      setIsAuth(true);
      setLoading(true); // Show loading during role fetch

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        const roleData = snap.exists() ? snap.data()?.role as Role : null;
        setRole(roleData);
      } catch (err) {
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f7f4]">
        <div className="text-stone-600 text-lg">Verifying access...</div>
      </div>
    );
  }

  if (!isAuth) return <Navigate to="/login" replace />;

  if (!role || !allowedRoles.includes(role as Role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f7f4] p-8 text-center">
        <div>
          <h1 className="text-6xl font-bold text-stone-200 mb-4">403</h1>
          <h2 className="text-2xl font-bold text-stone-800 mb-4">Access Denied</h2>
          <p className="text-stone-600 mb-8 max-w-md mx-auto">Insufficient permissions for this page.</p>
          <a href="/" className="inline-block bg-emerald-600 text-white px-8 py-4 rounded-full font-bold hover:bg-emerald-700 transition-all shadow-lg">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
