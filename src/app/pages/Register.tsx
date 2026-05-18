import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../../utils/firebase/config";
import { mapFirebaseAuthError } from "../../utils/firebase/errorMapper";
import { useAuth } from "../context/AuthContext";
import { ErrorModal } from "../components/ErrorModal";
import { usePHPhone } from "../hooks/usePHPhone";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    address: "",
  });

  const phone = usePHPhone();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let createdUser: User | null = null;

    try {
      if (phone.value && !phone.isValid) {
        setError(phone.error || "Invalid phone number");
        setLoading(false);
        return;
      }

      const cleanEmail = formData.email.trim().toLowerCase();
      const cleanName = formData.name.trim();
      const cleanAddress = formData.address.trim();

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        formData.password
      );

      const user = userCredential.user;
      createdUser = user;

      await updateProfile(user, {
        displayName: cleanName,
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: cleanEmail,
        fullName: cleanName,
        phoneNumber: phone.normalized,
        address: cleanAddress,
        role: "customer",
        hasPassword: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await refreshProfile();

      navigate("/", { replace: true });
    } catch (err: unknown) {
      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch {
          // Ignore rollback error
        }
      }

      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-12 sm:p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Register
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />

            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />

            <Input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />

            <Input
              type="tel"
              placeholder="09171234567 or +639171234567"
              value={phone.value}
              onChange={(e) => phone.onChange(e.target.value)}
            />

            <textarea
              placeholder="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full min-h-[100px] rounded-xl border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring outline-none"
            />

            <ErrorModal message={error} onClose={() => setError("")} />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Register"}
            </Button>
          </form>

          <p className="mt-4 text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}