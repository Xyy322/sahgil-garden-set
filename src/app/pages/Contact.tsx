import { useEffect, useState, type FormEvent } from "react";
import { MapPin, Phone, Mail, Send, Leaf } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { db } from "../../utils/firebase/config";
import { useAuth } from "../context/AuthContext";
import { createNotification } from "../../utils/createNotification";

type InquiryType =
  | "General Inquiry"
  | "Custom Build Request"
  | "Landscaping Concern";

export function Contact() {
  const { user, profile, role, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "General Inquiry" as InquiryType,
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const authEmail = user?.email || profile?.email || "";
  const isRegisteredCustomer = Boolean(user && role === "customer");

  useEffect(() => {
    if (authLoading || !user || role !== "customer") return;

    setFormData((prev) => ({
      ...prev,
      name: prev.name || profile?.fullName || user.displayName || "",
      email: prev.email || authEmail,
      phone: prev.phone || profile?.phoneNumber || "",
    }));
  }, [authLoading, user, role, profile, authEmail]);

  const splitFullName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ");

    return { firstName, lastName };
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (authLoading) {
        throw new Error("Please wait while your account is being verified.");
      }

      if (user && role !== "customer") {
        throw new Error("Admin accounts cannot submit customer inquiries.");
      }

      const cleanName = formData.name.trim();
      const cleanEmail = isRegisteredCustomer
        ? authEmail.trim()
        : formData.email.trim();
      const cleanPhone = formData.phone.trim();
      const cleanMessage = formData.message.trim();

      if (!cleanName || !cleanEmail || !cleanPhone || !cleanMessage) {
  throw new Error("Please fill in all required fields.");
}

      if (!isValidEmail(cleanEmail)) {
        throw new Error("Please enter a valid email address.");
      }

      const { firstName, lastName } = splitFullName(cleanName);

      const inquiryRef = await addDoc(collection(db, "inquiries"), {
        userId: user && role === "customer" ? user.uid : "",
        customerType: user && role === "customer" ? "registered" : "guest",

        firstName,
        lastName,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,

        inquiryType: formData.inquiryType,
        message: cleanMessage,

        adminRead: false,
        adminReadAt: null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (user && role === "customer") {
        await createNotification({
          userId: "admin",
          title: "New inquiry submitted",
          message: `${cleanName} submitted a ${formData.inquiryType.toLowerCase()}.`,
          type: "inquiry",
          statusRefId: inquiryRef.id,
        });

        await createNotification({
          userId: user.uid,
          title: "Inquiry submitted",
          message: "Your inquiry has been submitted successfully.",
          type: "inquiry",
          statusRefId: inquiryRef.id,
        });
      }

      setSubmitted(true);

      setFormData({
        name: user && role === "customer" ? profile?.fullName || user.displayName || "" : "",
        email: user && role === "customer" ? authEmail : "",
        phone: user && role === "customer" ? profile?.phoneNumber || "" : "",
        inquiryType: "General Inquiry",
        message: "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f9f7f4] min-h-screen">
      <section className="relative w-full h-[65vh] min-h-[500px] bg-stone-900 flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-stone-900 to-emerald-900/30" />

        <div className="relative z-10 text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Get In Touch
          </h1>
          <p className="text-lg md:text-xl text-stone-200">
            Send an inquiry about products, custom builds, or landscaping.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-2 md:px-4 py-12 md:py-20 grid lg:grid-cols-2 gap-10 md:gap-16">
        <div className="space-y-6 md:space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-stone-100">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 mb-2 md:mb-4">
              <MapPin className="text-emerald-600" />
              Visit Us
            </h2>
            <p className="text-stone-600">
              Barangay Lumil, Silang, Cavite, Philippines
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-stone-100 text-center flex flex-col items-center">
              <Phone className="mx-auto text-emerald-600 mb-2 md:mb-3" />
              <h3 className="font-bold text-stone-800">Call</h3>
              <p className="text-stone-600">+63 917 123 4567</p>
            </div>

            <div className="bg-white p-5 md:p-6 rounded-2xl border border-stone-100 text-center flex flex-col items-center">
              <Mail className="mx-auto text-emerald-600 mb-2 md:mb-3" />
              <h3 className="font-bold text-stone-800">Email</h3>
              <p className="text-stone-600 break-all">
                sahgilgardenset@gmail.com
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <h3 className="font-bold text-stone-900 mb-2">
              Custom Build Requests
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Guests and registered customers may send inquiries for custom
              furniture, per-piece requests, or special dimensions. Orders and
              appointments still require a customer account.
            </p>
          </div>
        </div>

        <div>
          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="bg-white p-6 md:p-8 rounded-2xl border border-stone-100 space-y-5 md:space-y-6 shadow-sm"
            >
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">
                  Send Inquiry
                </h2>
                <p className="text-sm text-stone-500">
                  You may send an inquiry even without logging in.
                </p>
              </div>

              <input
                type="text"
                placeholder="Full Name *"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <input
                  type="email"
                  placeholder="Email *"
                  value={isRegisteredCustomer ? authEmail : formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isRegisteredCustomer
                      ? "border-stone-100 bg-stone-100 text-stone-500 cursor-not-allowed"
                      : "border-stone-200"
                  }`}
                  disabled={isRegisteredCustomer}
                  required
                />

                <input
                  type="tel"
                  placeholder="Phone *"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={formData.inquiryType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    inquiryType: e.target.value as InquiryType,
                  })
                }
                className="w-full px-4 py-3 border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="General Inquiry">General Inquiry</option>
                <option value="Custom Build Request">Custom Build Request</option>
                <option value="Landscaping Concern">Landscaping Concern</option>
              </select>

              <textarea
                placeholder="Message *"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="w-full px-4 py-3 border border-stone-200 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                required
              />

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || authLoading}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
              >
                <Send size={18} />
                {loading || authLoading ? "Sending..." : "Send Inquiry"}
              </button>

              {!user && (
                <p className="text-center text-xs text-stone-500">
                  Guest inquiries are allowed, but only registered customers can
                  track inquiry history from their dashboard.
                </p>
              )}
            </form>
          ) : (
            <div className="bg-emerald-50 p-8 md:p-12 rounded-2xl text-center border border-emerald-100 flex flex-col items-center">
              <Leaf
                className="mx-auto text-emerald-600 mb-3 md:mb-4"
                size={40}
              />

              <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
                Inquiry Sent!
              </h2>

              <p className="text-emerald-700 mb-4">
                Your inquiry has been submitted successfully.
              </p>

              <p className="text-sm text-emerald-700 mb-4">
                The admin may contact you through the email or phone number you
                provided.
              </p>

              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 md:mt-6 bg-emerald-600 text-white px-5 md:px-6 py-2 md:py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Send Another
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}