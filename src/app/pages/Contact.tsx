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
      <section className="relative h-[400px] md:h-[500px] bg-stone-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-stone-900 to-emerald-900/30"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Get In Touch</h1>
          <p className="text-xl max-w-2xl">Let's talk about your vision.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-20 grid lg:grid-cols-2 gap-16">

        {/* CONTACT INFO */}
        <div className="space-y-8">

          <div className="bg-white p-8 rounded-2xl shadow-sm border">
            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4">
              <MapPin className="text-emerald-600" />
              Visit Us
            </h2>
            <p className="text-stone-600"> Baranggay Lumil, Silang, Cavite, Philippines </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            <div className="bg-white p-6 rounded-2xl border text-center">
              <Phone className="mx-auto text-emerald-600 mb-3" />
              <h3 className="font-bold">Call</h3>
              <p>+63 917 123 4567</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border text-center">
              <Mail className="mx-auto text-emerald-600 mb-3" />
              <h3 className="font-bold">Email</h3>
              <p>sahgilgardenset@gmail.com</p>
            </div>

          </div>
        </div>

        {/* FORM */}
        <div>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border space-y-6">

              <h2 className="text-2xl font-bold">Send Message</h2>

              {/* NAME */}
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border rounded-xl"
                required
              />

              {/* EMAIL + PHONE */}
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={authEmail}
                  className="w-full p-3 border rounded-xl bg-stone-100"
                  disabled
                  required
                />

                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 border rounded-xl"
                />
              </div>

              {/* MESSAGE */}
              <textarea
                placeholder="Message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-3 border rounded-xl h-32"
                required
              />

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Send size={18} />
                {loading ? "Sending..." : "Send Message"}
              </button>

            </form>
          ) : (
            <div className="bg-emerald-50 p-12 rounded-2xl text-center border">
              <Leaf className="mx-auto text-emerald-600 mb-4" size={48} />
              <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
              <p className="text-emerald-700">We’ll get back to you soon.</p>

              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 bg-emerald-600 text-white px-6 py-2 rounded-xl"
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