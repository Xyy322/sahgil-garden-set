import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  Timestamp,
  arrayUnion,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../utils/firebase/config";
import { createNotification } from "../../utils/createNotification";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { ScrollArea } from "../components/ui/scroll-area";

import type { Inquiry, Message } from "../../types/inquiry";

function formatDate(value?: Timestamp) {
  if (!value) return "N/A";
  return value.toDate().toLocaleString();
}

function statusBadge(status: Inquiry["status"]) {
  switch (status) {
    case "responded":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "closed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

export function AdminInquiries() {
  const navigate = useNavigate();

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState<"admin" | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [currentAdminName, setCurrentAdminName] = useState("");
  const selectedLiveInquiry = selectedInquiry
    ? inquiries.find((inq) => inq.id === selectedInquiry.id) || selectedInquiry
    : null;

  // =========================
  // AUTH CHECK
  // =========================
  useEffect(() => {
    const auth = getAuth();

    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        setRole(userDoc.data().role || null);
        setCurrentAdminName(userDoc.data().fullName || "Admin");
      } else {
        setRole(null);
      }
    });

    return () => unsub();
  }, [navigate]);

  // =========================
  // LOAD INQUIRIES (REALTIME)
  // =========================
  useEffect(() => {
    if (role !== "admin") return;

    const unsub = onSnapshot(collection(db, "inquiries"), (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Inquiry, "id">)
      }));

      setInquiries(
        data.sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) -
            (a.createdAt?.toMillis?.() || 0)
        )
      );

      setLoading(false);
    });

    return () => unsub();
  }, [role]);

  // =========================
  // UPDATE STATUS
  // =========================
  const updateStatus = async (id: string, status: Inquiry["status"]) => {
    try {
      setUpdatingId(id);

      await updateDoc(doc(db, "inquiries", id), {
        status,
        updatedAt: Timestamp.now()
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================
  // SEND REPLY
  // =========================
  const sendReply = async () => {
    if (!selectedLiveInquiry || !replyText.trim()) return;

    try {
      setSendingReply(true);

      const message: Message = {
        sender: "admin",
        content: replyText.trim(),
        timestamp: Timestamp.now(),
        senderName: currentAdminName
      };

      const updateData: any = {
        messages: arrayUnion(message)
      };

      if (selectedLiveInquiry.status === "pending") {
        updateData.status = "responded";
      }

      await updateDoc(doc(db, "inquiries", selectedLiveInquiry.id), updateData);

      const usersSnap = await getDocs(
        query(collection(db, "users"), where("email", "==", selectedLiveInquiry.email))
      );
      const customerUserId = usersSnap.docs[0]?.id;

      if (customerUserId) {
        const inquiryType = selectedLiveInquiry.inquiryType || "Inquiry";
        await createNotification({
          userId: customerUserId,
          title: `New ${inquiryType} reply`,
          message: `Admin replied to your ${inquiryType.toLowerCase()} inquiry.`,
          type: "inquiry",
          statusRefId: selectedLiveInquiry.id,
        });
      }

      setReplyText("");
    } finally {
      setSendingReply(false);
    }
  };

  // =========================
  // CLOSE INQUIRY
  // =========================
  const closeInquiry = async (id: string) => {
    try {
      setUpdatingId(id);

      await updateDoc(doc(db, "inquiries", id), {
        status: "closed",
        updatedAt: Timestamp.now()
      });

      setSelectedInquiry(null);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="p-10">Loading inquiries...</div>;
  }

  return (
    <div className="space-y-6">

      {/* LIST */}
      <div className="bg-white p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Inquiries</h2>

        {inquiries.length === 0 ? (
          <p>No inquiries found.</p>
        ) : (
          inquiries.map((inq) => (
            <div key={inq.id} className="border p-4 rounded mb-3">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">
                    {inq.firstName} {inq.lastName}
                  </p>
                  <p className="text-sm">{inq.email}</p>

                  <span className={`text-xs px-2 py-1 border rounded ${statusBadge(inq.status)}`}>
                    {inq.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setSelectedInquiry(inq)}>
                    View
                  </button>

                  {inq.status !== "closed" && (
                    <button onClick={() => updateStatus(inq.id, "closed")}>
                      Close
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-2 text-sm">{inq.message}</p>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conversation</DialogTitle>
          </DialogHeader>

          {selectedLiveInquiry && (
            <>
              <ScrollArea className="h-60 border p-3">
                {(selectedLiveInquiry.messages || []).map((m, i) => (
                  <div key={i} className="mb-2">
                    <p className="font-semibold text-sm">
                      {m.sender === "admin" ? "Admin" : (m.senderName || "Customer")}
                    </p>
                    <p className="text-sm">{m.content}</p>
                  </div>
                ))}
              </ScrollArea>

              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply..."
              />

              <div className="flex justify-end gap-2 mt-2">
                <Button onClick={() => setSelectedInquiry(null)}>
                  Close
                </Button>

                <Button onClick={sendReply} disabled={sendingReply}>
                  Send
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

