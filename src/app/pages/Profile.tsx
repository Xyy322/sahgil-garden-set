import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import {
  ArrowLeft,
  AtSign,
  Edit3,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

import { db } from "../../utils/firebase/config";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

interface ProfileData {
  uid?: string;
  email?: string;
  fullName?: string;
  username?: string;
  phoneNumber?: string;
  address?: string;
  role?: string;
}

function ProfileField({
  icon,
  label,
  value,
  wide = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-stone-100 bg-stone-50 p-4 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
        {icon}
        {label}
      </div>

      <p className="break-words text-base font-semibold text-stone-900 md:text-lg">
        {value}
      </p>
    </div>
  );
}

export function Profile() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user || role !== "customer") {
      setProfileData(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    setProfileError("");

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        if (!snapshot.exists()) {
          setProfileData(null);
          setProfileError("Profile record was not found.");
          setProfileLoading(false);
          return;
        }

        const data = snapshot.data() as ProfileData;

        setProfileData({
          uid: user.uid,
          email: typeof data.email === "string" ? data.email : user.email || "",
          fullName:
            typeof data.fullName === "string"
              ? data.fullName
              : user.displayName || "",
          username: typeof data.username === "string" ? data.username : "",
          phoneNumber:
            typeof data.phoneNumber === "string" ? data.phoneNumber : "",
          address: typeof data.address === "string" ? data.address : "",
          role: typeof data.role === "string" ? data.role : "customer",
        });

        setProfileError("");
        setProfileLoading(false);
      },
      (error) => {
        console.error("Profile listener error:", error);
        setProfileData(null);
        setProfileError(error.message || "Failed to load profile.");
        setProfileLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loading, user, role]);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f7f4] text-stone-600">
        Loading profile...
      </div>
    );
  }

  if (!user || role !== "customer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f7f4] p-6 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Only logged-in customers can view this profile.
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f7f4] p-6 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {profileError}
        </div>
      </div>
    );
  }

  const displayName = profileData?.fullName || user.displayName || "Not set";
  const displayUsername = profileData?.username || "Not set";
  const displayEmail = profileData?.email || user.email || "Not set";
  const displayPhone = profileData?.phoneNumber || "Not set";
  const displayAddress = profileData?.address || "Not set";

  return (
    <div className="page-fade-in min-h-screen bg-[#f9f7f4] px-4 py-10 md:py-14">
      <div className="mx-auto w-full max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/dashboard/customer")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-sm">
          <div className="border-b border-stone-100 bg-gradient-to-br from-emerald-700 to-emerald-900 px-6 py-8 text-white md:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white shadow-sm backdrop-blur">
                  <UserRound className="h-8 w-8" />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
                    Customer Profile
                  </p>

                  <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                    My Profile
                  </h1>

                  <p className="mt-1 text-sm text-emerald-50">
                    View and manage your account information.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => navigate("/profile/edit")}
                className="button-press w-full rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 sm:w-auto"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ProfileField
                icon={<UserRound className="h-4 w-4" />}
                label="Full Name"
                value={displayName}
              />

              <ProfileField
                icon={<AtSign className="h-4 w-4" />}
                label="Username"
                value={displayUsername}
              />

              <ProfileField
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={displayEmail}
                wide
              />

              <ProfileField
                icon={<Phone className="h-4 w-4" />}
                label="Phone Number"
                value={displayPhone}
                wide
              />

              <ProfileField
                icon={<MapPin className="h-4 w-4" />}
                label="Address"
                value={displayAddress}
                wide
              />
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-800">
              Keep your contact information updated so the business can confirm
              your orders, appointments, and delivery details properly.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}