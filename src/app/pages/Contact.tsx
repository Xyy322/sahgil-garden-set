import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Send, Leaf, Calendar } from 'lucide-react';
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../utils/firebase/config";

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [authEmail, setAuthEmail] = useState('');

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((user) => {
      setAuthEmail(user?.email || '');
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // validation
      if (!formData.name || !authEmail || !formData.message) {
        throw new Error('Please fill in all required fields');
      }

      const now = Timestamp.now();

              await addDoc(collection(db, "inquiries"), {
          firstName: formData.name.trim().split(" ")[0] || formData.name.trim(),
          lastName: formData.name.trim().split(" ").slice(1).join(" ") || "",
          email: authEmail,
          inquiryType: "general",
          status: "pending",
          messages: [
          {
          sender: "customer",
          content: formData.message.trim(),
          timestamp: Timestamp.now(),
          senderName: formData.name
          }
        ],
  createdAt: now,
  updatedAt: now
});

      setSubmitted(true);

      // reset form
      setFormData({
        name: '',
        phone: '',
        message: ''
      });

    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f9f7f4] min-h-screen">
      {/* HERO */}
      <section className="relative h-[320px] md:h-[420px] bg-stone-900 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-stone-900 to-emerald-900/30"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">Get In Touch</h1>
          <p className="text-lg md:text-xl max-w-2xl">Let's talk about your vision.</p>
        </div>
      </section>
      <div className="max-w-5xl mx-auto px-2 md:px-4 py-12 md:py-20 grid lg:grid-cols-2 gap-10 md:gap-16">
        {/* CONTACT INFO */}
        <div className="space-y-6 md:space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-stone-100">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 mb-2 md:mb-4">
              <MapPin className="text-emerald-600" />
              Visit Us
            </h2>
            <p className="text-stone-600">Baranggay Lumil, Silang, Cavite, Philippines</p>
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
              <p className="text-stone-600">sahgilgardenset@gmail.com</p>
            </div>
          </div>
        </div>
        {/* FORM */}
        <div>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-stone-100 space-y-5 md:space-y-6 shadow-sm">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Send Message</h2>
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={authEmail}
                  className="w-full px-4 py-3 border border-stone-100 rounded-lg bg-stone-100 text-stone-500 cursor-not-allowed"
                  disabled
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <textarea
                placeholder="Message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 border border-stone-200 rounded-lg min-h-[96px] focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                required
              />
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
              >
                <Send size={18} />
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          ) : (
            <div className="bg-emerald-50 p-8 md:p-12 rounded-2xl text-center border border-emerald-100 flex flex-col items-center">
              <Leaf className="mx-auto text-emerald-600 mb-3 md:mb-4" size={40} />
              <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">Message Sent!</h2>
              <p className="text-emerald-700 mb-4">We’ll get back to you soon.</p>
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