import { useEffect, useState } from "react";
import { db } from "../../utils/firebase/config";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  Timestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { ScrollArea } from "../components/ui/scroll-area";

interface Message {
  sender: "admin" | "customer";
  content: string;
  timestamp: Timestamp;
  senderName?: string;
}

interface InquiryData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  inquiryType: string;
  message: string;
  status: "pending" | "responded" | "closed";
  messages?: Message[];
  createdAt?: Timestamp;
}

export function CustomerInquiries() {
  const [inquiries, setInquiries] = useState<InquiryData[]>([]);
  const [selectedInquiry, setSelectedInquiry] =
    useState<InquiryData | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);

  // AUTH
  useEffect(() => {
    const auth = getAuth();

    const unsub = auth.onAuthStateChanged((user) => {
      setUserEmail(user?.email || null);
    });

    return () => unsub();
  }, []);

  // LOAD INQUIRIES
  useEffect(() => {
    if (!userEmail) {
      setInquiries([]);
      return;
    }

    const q = query(
      collection(db, "inquiries"),
      where("email", "==", userEmail),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const mapped = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as InquiryData[];

      setInquiries(mapped);
    });

    return () => unsub();
  }, [userEmail]);

  // SEND REPLY
  const sendReply = async () => {
    if (!selectedInquiry || !replyText.trim()) return;

    try {
      setSendingReply(true);

      const authEmail = getAuth().currentUser?.email;
      if (!authEmail) return;

      const newMessage: Message = {
        sender: "customer",
        content: replyText,
        timestamp: Timestamp.now(),
        senderName: authEmail,
      };

      await updateDoc(doc(db, "inquiries", selectedInquiry.id), {
        messages: arrayUnion(newMessage),
      });

      setReplyText("");
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100">
        <h2 className="text-2xl font-bold mb-6 text-stone-900">Your Inquiries</h2>

        {inquiries.length === 0 ? (
          <div className="text-center py-12 text-stone-500">No inquiries yet.</div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="rounded-2xl border border-stone-100 bg-stone-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-800 truncate">{inquiry.inquiryType}</h3>
                  <p className="text-sm text-stone-600 truncate">{inquiry.message}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full font-medium border ${
                    inquiry.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    inquiry.status === 'responded' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    inquiry.status === 'closed' ? 'bg-stone-100 text-stone-700 border-stone-200' :
                    'bg-stone-100 text-stone-700 border-stone-200'
                  }`}>
                    {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  <Button size="sm" onClick={() => setSelectedInquiry(inquiry)} className="h-9 px-4">View</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CHAT MODAL */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-stone-100">
            <DialogTitle className="text-lg font-bold text-stone-900">Conversation</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-0">
            <ScrollArea className="h-64 border-b border-stone-100 px-6 py-4 bg-stone-50">
              {selectedInquiry?.messages?.length ? (
                selectedInquiry.messages.map((msg, i) => (
                  <div key={i} className={`mb-4 flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-xl px-4 py-2 max-w-xs break-words ${msg.sender === 'admin' ? 'bg-emerald-50 text-stone-800' : 'bg-white text-stone-900 border border-stone-200'}`}>
                      <span className="block text-sm">{msg.content}</span>
                    </div>
                    <span className="text-xs mt-1 text-stone-400">{msg.sender === 'admin' ? 'Admin' : 'You'}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-stone-500">No messages yet.</div>
              )}
            </ScrollArea>
            <div className="p-6 flex flex-col gap-3">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type message..."
                className="resize-none min-h-[48px]"
              />
              <Button
                onClick={sendReply}
                disabled={sendingReply || !replyText.trim()}
                className="h-10 w-full"
              >
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}