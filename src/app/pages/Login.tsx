import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";

import { auth, db } from "../../utils/firebase/config";
import { mapFirebaseAuthError } from "../../utils/firebase/errorMapper";
import { ErrorModal } from "../components/ErrorModal";
import { useAuth } from "../context/AuthContext";

function getSafeRedirectPath(from: unknown): string | null {
  if (typeof from !== "string") {
    return null;
  }

  const trimmedPath = from.trim();

  if (!trimmedPath.startsWith("/") || trimmedPath.startsWith("//")) {
    return null;
  }

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

  if (safePath.startsWith("/dashboard/admin")) {
    return "/dashboard/customer";
  }

  return safePath;
}

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <h1 className="mb-6 text-4xl font-bold text-stone-800">Login</h1>

      <p className="mb-8 max-w-2xl text-xl text-stone-600">
        Access your account to manage your consultations and orders.
      </p>

      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl border border-stone-100 bg-white p-8 text-left shadow-sm"
      >
        <div className="mb-4">
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-stone-700"
          >
            Email Address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter your email address"
            autoComplete="email"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-semibold text-stone-700"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-4 py-3 pr-12 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter your password"
              autoComplete="current-password"
              minLength={8}
              required
              disabled={isSubmitting}
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isSubmitting}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-stone-900 py-3 text-center font-semibold text-white shadow-md transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </div>

        <div className="text-center text-sm text-stone-500">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className="cursor-pointer border-none bg-transparent p-0 font-semibold text-emerald-600 hover:underline"
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