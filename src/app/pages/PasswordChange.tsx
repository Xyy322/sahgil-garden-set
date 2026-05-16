  import { useState } from "react";
  import { useNavigate } from "react-router";
  import { getAuth, sendPasswordResetEmail } from "firebase/auth";
  import { Lock, Mail, ArrowLeft, Send } from "lucide-react";
  import { mapFirebaseAuthError } from "../../utils/firebase/errormapper";
  import { ErrorModal } from "../components/ErrorModal";

  export function PasswordChange() {
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const [error, setError] = useState(''); 

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSending(true);
      setMessage('');
      const auth = getAuth();
      try {
        await sendPasswordResetEmail(auth, email);
        setMessage('If an account exists, a reset link has been sent.');
      } catch (err: unknown) {
        setError(mapFirebaseAuthError(err));
      }
      setSending(false);
    };

    return (
      <div className="bg-[#f9f7f4] min-h-screen py-12">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <button 
            onClick={() => navigate("/profile")}
            className="mb-8 flex items-center gap-2 text-stone-600 hover:text-stone-800 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Profile
          </button>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-stone-800 mb-2">Change Password</h1>
              <p className="text-stone-600">We'll send a reset link to your email</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('Error') ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
                  {message}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-700 py-3 px-6 rounded-xl font-medium transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={sending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-all shadow-sm shadow-blue-600/20 hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {sending ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

