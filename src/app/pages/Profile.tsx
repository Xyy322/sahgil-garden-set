import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { User, Mail, Phone, MapPin } from "lucide-react";

import { db } from "../../utils/firebase/config";
import { useAuth } from "../context/AuthContext";

interface ProfileData {
  uid?: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  role?: string;
}

export function Profile() {
  const navigate = useNavigate();
  const { user, role, loading, logout } = useAuth();

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
      <div className="min-h-screen flex items-center justify-center text-stone-600">
        Loading profile...
      </div>
    );
  }

  if (!user || role !== "customer") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#f9f7f4]">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Only logged-in customers can view this profile.
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#f9f7f4]">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {profileError}
        </div>
      </div>
    );
  }

  const displayName = profileData?.fullName || user.displayName || "Not set";
  const displayEmail = profileData?.email || user.email || "Not set";
  const displayPhone = profileData?.phoneNumber || "Not set";
  const displayAddress = profileData?.address || "Not set";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="bg-[#f9f7f4] min-h-screen py-8 md:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-5 md:mb-6 shadow-2xl">
            <User className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-1">
            My Profile
          </h1>

          <p className="text-stone-600 text-sm md:text-base">
            View your account details
          </p>
        </div>

        <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-stone-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="text-xs md:text-sm font-medium text-stone-500 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>

              <p className="font-semibold text-base md:text-lg text-stone-800 break-words">
                {displayEmail}
              </p>
            </div>

            <div>
              <label className="text-xs md:text-sm font-medium text-stone-500 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Name
              </label>

              <p className="font-semibold text-base md:text-lg text-stone-800 break-words">
                {displayName}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs md:text-sm font-medium text-stone-500 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone
              </label>

              <p className="font-semibold text-base md:text-lg text-stone-800 break-words">
                {displayPhone}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs md:text-sm font-medium text-stone-500 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </label>

              <p className="font-semibold text-base md:text-lg text-stone-800 break-words">
                {displayAddress}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-5 md:pt-6 border-t border-stone-100">
            <button
              onClick={() => navigate("/profile/edit")}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 md:px-6 rounded-lg md:rounded-xl font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}