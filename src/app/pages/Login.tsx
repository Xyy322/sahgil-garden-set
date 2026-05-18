// The Login page handles user authentication and role-based navigation.
// It directly affects the system by determining user access and redirecting to the correct dashboard.
// This file integrates with Firebase Auth and Firestore for user profile resolution.
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../../utils/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { mapFirebaseAuthError } from "../../utils/firebase/errorMapper";
import { ErrorModal } from "../components/ErrorModal";
import { useAuth } from "../context/AuthContext";

export function Login() {
  // State for email, password, and error messages. 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
const { refreshProfile } = useAuth();

  // Handles login form submission and authentication.
  // This function signs in the user and resolves their profile for role-based navigation.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      // Try Firebase Auth sign in first.
      const cleanEmail = email.trim().toLowerCase();
const userCredential = await signInWithEmailAndPassword(
  auth,
  cleanEmail,
  password
);

      // Resolve profile by UID (standardized)
      const uidDocRef = doc(db, "users", userCredential.user.uid);
      const uidDocSnap = await getDoc(uidDocRef);

      const profileData = uidDocSnap.data() as Record<string, unknown> | undefined;

      // If no profile found, show error.
      if (
  !profileData ||
  (profileData.role !== "admin" && profileData.role !== "customer")
) {
  await signOut(auth);
  setError("Invalid user profile. Please register again or contact support.");
  return;
}

const role = profileData.role;

await refreshProfile();

const from = location.state?.from;

if (role === "admin") {
  navigate("/dashboard/admin", { replace: true });
} else {
  navigate("/", { replace: true });
}
    }catch (err: unknown) {
  setError(mapFirebaseAuthError(err));
}
  };  

  // Render the login form UI.
  return (
    <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-stone-800 mb-6">Login</h1>
      <p className="text-xl text-stone-600 max-w-2xl mb-8">Access your account to manage your consultations and orders.</p>
      <form onSubmit={handleLogin} className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-left">
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            placeholder="Email Address"
            required
          />
        </div>
        <div className="mb-6">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            placeholder="Password"
            minLength={8}
            required
          />
        </div>
        <div className="flex flex-col gap-3 mb-6">
          <button type="submit" className="w-full py-3 bg-stone-900 text-white rounded-lg font-semibold hover:bg-stone-800 transition-colors text-center shadow-md">
            Sign In
          </button>
        </div>
        <div className="text-sm text-center text-stone-500">
          Don't have an account?{' '}
          <button
            type="button"
            className="text-emerald-600 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0"
            onClick={() => navigate("/register")}
          >
            Create one
          </button>
        </div>
        <ErrorModal message={error} onClose={() => setError("")} />
      </form>
    </div>
    
  );
}
