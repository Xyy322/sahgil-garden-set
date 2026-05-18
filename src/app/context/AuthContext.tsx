import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../utils/firebase/config";

export type AppRole = "admin" | "customer";

type UserProfile = {
  uid: string;
  email?: string;
  fullName?: string;
  role: AppRole;
};

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  role: AppRole | null;
  loading: boolean;
  profileError: string;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isValidRole(role: unknown): role is AppRole {
  return role === "admin" || role === "customer";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const loadProfile = async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setProfile(null);
      setRole(null);
      setProfileError("");
      return;
    }

    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setProfile(null);
        setRole(null);
        setProfileError("Your account is missing a user profile.");
        return;
      }

      const data = userSnap.data();

      if (!isValidRole(data.role)) {
        setProfile(null);
        setRole(null);
        setProfileError("Your account has an invalid role.");
        return;
      }

      setProfile({
        uid: firebaseUser.uid,
        email:
          typeof data.email === "string"
            ? data.email
            : firebaseUser.email ?? "",
        fullName: typeof data.fullName === "string" ? data.fullName : "",
        role: data.role,
      });

      setRole(data.role);
      setProfileError("");
    } catch (error) {
      console.error("Failed to load user profile:", error);
      setProfile(null);
      setRole(null);
      setProfileError("Unable to load your user profile.");
    }
  };

    const refreshProfile = async () => {
    await loadProfile(auth.currentUser);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setRole(null);
    setProfileError("");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      await loadProfile(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        profileError,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}