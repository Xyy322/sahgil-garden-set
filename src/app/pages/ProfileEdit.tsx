import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../utils/firebase/config";
import { usePHPhone } from "../hooks/usePHPhone";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

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
    <div className="min-h-screen bg-background text-foreground py-8 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full Name"
                autoComplete="name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Username</label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Username"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
              <Input
                value={phone.value}
                onChange={(e) => phone.onChange(e.target.value)}
                placeholder="0917xxxxxxx"
                className={phone.value && !phone.isValid ? "border-destructive" : ""}
                autoComplete="tel"
                required
              />
              {phone.value && !phone.isValid && (
                <p className="text-xs text-destructive mt-1">{phone.error || "Invalid phone number"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full min-h-[64px] resize-none rounded-xl border border-border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring outline-none"
                placeholder="Address"
                autoComplete="street-address"
                required
              />
            </div>
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}