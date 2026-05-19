import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../utils/firebase/config";
import { mapFirebaseAuthError } from "../../utils/firebase/errorMapper";
import { ErrorModal } from "../components/ErrorModal";
import { useAuth } from "../context/AuthContext";

function getSafeRedirectPath(from: unknown): string | null {
  if (typeof from !== "string") {
    return null;
  }

  const trimmedPath = from.trim();

  // Only allow internal app routes.
  // This prevents unsafe redirects such as "https://fake-site.com".
  if (!trimmedPath.startsWith("/") || trimmedPath.startsWith("//")) {
    return null;
  }

  // Do not redirect users back to login/register after logging in.
  if (trimmedPath === "/login" || trimmedPath === "/register") {
    return null;
  }

  return trimmedPath;
}

function getCustomerRedirectPath(from: unknown): string {
  const safePath = getSafeRedirectPath(from);

  if (!safePath) {
    return "/dashboard/customer";
  }

  // Customers should never be redirected to admin-only pages.
  if (safePath.startsWith("/dashboard/admin")) {
    return "/dashboard/customer";
  }

  return safePath;
}

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const { refreshProfile } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const userRef = doc(db, "users", userCredential.user.uid);
      const userSnap = await getDoc(userRef);

      const profileData = userSnap.data() as
        | { role?: unknown }
        | undefined;

      if (
        !profileData ||
        (profileData.role !== "admin" && profileData.role !== "customer")
      ) {
        await signOut(auth);
        setError(
          "Invalid user profile. Please register again or contact support."
        );
        return;
      }

      const role = profileData.role;

      await refreshProfile();

      if (role === "admin") {
        navigate("/dashboard/admin", { replace: true });
        return;
      }

      navigate(getCustomerRedirectPath(location.state?.from), {
        replace: true,
      });
    } catch (err: unknown) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-stone-800 mb-6">Login</h1>

      <p className="text-xl text-stone-600 max-w-2xl mb-8">
        Access your account to manage your consultations and orders.
      </p>

      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-left"
      >
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            placeholder="Email Address"
            autoComplete="email"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            placeholder="Password"
            autoComplete="current-password"
            minLength={8}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-stone-900 text-white rounded-lg font-semibold hover:bg-stone-800 transition-colors text-center shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </div>

        <div className="text-sm text-center text-stone-500">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className="text-emerald-600 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0"
            onClick={() => navigate("/register")}
            disabled={isSubmitting}
          >
            Create one
          </button>
        </div>

        <ErrorModal message={error} onClose={() => setError("")} />
      </form>
    </div>
  );
}