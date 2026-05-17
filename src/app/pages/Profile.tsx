import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../utils/firebase/config";

import { User, Mail, Phone } from "lucide-react";

export function Profile() {
  const [profileData, setProfileData] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        navigate("/login");
        return;
      }

      setAuthEmail(firebaseUser.email || null);

      try {
        const uidDoc = await getDoc(doc(db, "users", firebaseUser.uid));

        if (uidDoc.exists()) {
          setProfileData(uidDoc.data());
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-600">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="bg-[#f9f7f4] min-h-screen py-8 md:py-12">
      <div className="max-w-2xl mx-auto px-2 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center mb-8 md:mb-12">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-5 md:mb-6 shadow-2xl">
            <User className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-1">My Profile</h1>
          <p className="text-stone-600 text-sm md:text-base">View your account details</p>
        </div>
        {/* CONTENT */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-stone-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* EMAIL */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-stone-500 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="font-semibold text-base md:text-lg text-stone-800 truncate">
                {authEmail || "Not set"}
              </p>
            </div>
            {/* NAME */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-stone-500 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Name
              </label>
              <p className="font-semibold text-base md:text-lg text-stone-800 truncate">
                {profileData?.fullName || "Not set"}
              </p>
            </div>
            {/* PHONE (FIXED) */}
            {profileData?.phoneNumber && (
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-medium text-stone-500 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </label>
                <p className="font-semibold text-base md:text-lg text-stone-800 truncate">
                  {profileData.phoneNumber}
                </p>
              </div>
            )}
            {/* ADDRESS */}
            {profileData?.address && (
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-medium text-stone-500 mb-2">Address</label>
                <p className="font-semibold text-base md:text-lg text-stone-800 truncate">
                  {profileData.address}
                </p>
              </div>
            )}
          </div>
          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-5 md:pt-6 border-t border-stone-100">
            <button
              onClick={() => navigate("/profile/edit")}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 md:px-6 rounded-lg md:rounded-xl font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Edit Profile
            </button>
            <button
              onClick={() => navigate("/profile/password")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 md:px-6 rounded-lg md:rounded-xl font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Change Password
            </button>
            <button
              onClick={async () => {
                await signOut(getAuth());
                navigate("/login");
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 md:px-6 rounded-lg md:rounded-xl font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}