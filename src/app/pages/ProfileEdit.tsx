import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "../../utils/firebase/config";
import { useAuth } from "../context/AuthContext";
import { usePHPhone } from "../hooks/usePHPhone";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function ProfileEdit() {
  const navigate = useNavigate();
  const { user, profile, role, loading, refreshProfile } = useAuth();

  const phone = usePHPhone("");

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    address: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading || !user || role !== "customer") {
      return;
    }

    setFormData({
      name: profile?.fullName || user.displayName || "",
      username: (profile as any)?.username || "",
      address: profile?.address || "",
    });

    phone.setValue(profile?.phoneNumber || "");
  }, [loading, user, role, profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user || role !== "customer") {
      setError("Only logged-in customers can edit this profile.");
      return;
    }

    if (phone.value && !phone.isValid) {
      setError(phone.error || "Invalid phone number.");
      return;
    }

    const cleanName = formData.name.trim();
    const cleanUsername = formData.username.trim();
    const cleanAddress = formData.address.trim();

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanAddress) {
      setError("Please enter your address.");
      return;
    }

    setSaving(true);

    try {
      await updateProfile(user, {
        displayName: cleanName,
      });

      await setDoc(
  doc(db, "users", user.uid),
  {
    uid: user.uid,
    email: user.email || profile?.email || "",
    fullName: cleanName,
    username: cleanUsername,
    phoneNumber: phone.normalized || phone.value.trim(),
    address: cleanAddress,
    role: "customer",
    hasPassword: true,
    updatedAt: serverTimestamp(),
  },
  { merge: true }
);

      await refreshProfile();

      navigate("/profile", { replace: true });
    } catch (err) {
      console.error("Profile update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-600">
        Loading profile...
      </div>
    );
  }

  if (!user || role !== "customer") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Only logged-in customers can edit this profile.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Edit Profile
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Full Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Full Name"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Username
              </label>
              <Input
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="Username"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone Number
              </label>
              <Input
                value={phone.value}
                onChange={(e) => phone.onChange(e.target.value)}
                placeholder="0917xxxxxxx or +63917xxxxxxx"
                className={phone.value && !phone.isValid ? "border-destructive" : ""}
                autoComplete="tel"
              />

              {phone.value && !phone.isValid && (
                <p className="text-xs text-destructive mt-1">
                  {phone.error || "Invalid phone number"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full min-h-[80px] resize-none rounded-xl border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring outline-none"
                placeholder="Address"
                autoComplete="street-address"
                required
              />
            </div>

            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/profile")}
                disabled={saving}
                className="w-full"
              >
                Cancel
              </Button>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}