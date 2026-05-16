import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../utils/firebase/config";
import { usePHPhone } from "../hooks/usePHPhone";

export function ProfileEdit() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    address: ''
  });

  const phone = usePHPhone("");

  const [error, setError] = useState('');

  useEffect(() => {
    const auth = getAuth();

    onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const docSnap = await getDoc(doc(db, "users", user.uid));

      if (docSnap.exists()) {
        const data = docSnap.data();

        setFormData({
          name: data.fullName || '',
          username: data.username || '',
          address: data.address || ''
        });

        phone.setValue(data.phoneNumber || "");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phone.value && !phone.isValid) {
      setError(phone.error || "Invalid phone number");
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return;

    await setDoc(doc(db, "users", user.uid), {
      fullName: formData.name,
      username: formData.username,
      phoneNumber: phone.normalized,
      address: formData.address,
      updatedAt: new Date()
    }, { merge: true });

    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-[#f9f7f4] py-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-stone-100 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-6 text-center">Edit Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Full Name"
              className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoComplete="name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Username</label>
            <input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Username"
              className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
            <input
              value={phone.value}
              onChange={(e) => phone.onChange(e.target.value)}
              placeholder="0917xxxxxxx"
              className={`w-full px-4 py-3 rounded-lg border ${phone.value && !phone.isValid ? 'border-red-400' : 'border-stone-200'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              autoComplete="tel"
              required
            />
            {phone.value && !phone.isValid && (
              <p className="text-xs text-red-500 mt-1">{phone.error || "Invalid phone number"}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[64px] resize-none"
              placeholder="Address"
              autoComplete="street-address"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}