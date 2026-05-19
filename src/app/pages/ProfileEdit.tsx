import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { ArrowLeft, MapPin, Phone, Save, UserRound } from "lucide-react";

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

      toast.success("Profile updated", {
        description: "Your profile information has been saved successfully.",
      });

      navigate("/profile", { replace: true });
    } catch (err) {
      console.error("Profile update error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to update profile. Please try again.";

      setError(message);

      toast.error("Failed to update profile", {
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f7f4] text-stone-600">
        Loading profile...
      </div>
    );
  }

  if (!user || role !== "customer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f7f4] p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Only logged-in customers can edit this profile.
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade-in min-h-screen bg-[#f9f7f4] px-4 py-10 md:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </button>

        <Card className="overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-sm">
          <CardHeader className="border-b border-stone-100 bg-stone-50/70 px-6 py-6 md:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <UserRound className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Customer Profile
                </p>
                <CardTitle className="mt-1 text-2xl font-bold text-stone-900">
                  Edit Profile
                </CardTitle>
                <p className="mt-1 text-sm text-stone-500">
                  Update your personal information and delivery details.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-stone-800">
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
                  className="h-12 rounded-xl"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-stone-800">
                  E-mail
                </label>
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Username"
                  autoComplete="username"
                  className="h-12 rounded-xl"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-800">
                  <Phone className="h-4 w-4 text-emerald-700" />
                  Phone Number
                </label>
                <Input
                  value={phone.value}
                  onChange={(e) => phone.onChange(e.target.value)}
                  placeholder="0917xxxxxxx or +63917xxxxxxx"
                  className={`h-12 rounded-xl ${
                    phone.value && !phone.isValid ? "border-red-500" : ""
                  }`}
                  autoComplete="tel"
                />

                {phone.value && !phone.isValid && (
                  <p className="mt-1 text-xs text-red-600">
                    {phone.error || "Invalid phone number"}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-800">
                  <MapPin className="h-4 w-4 text-emerald-700" />
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="min-h-[110px] w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="Address"
                  autoComplete="street-address"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/profile")}
                  disabled={saving}
                  className="button-press h-12 w-full rounded-xl"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="button-press h-12 w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}