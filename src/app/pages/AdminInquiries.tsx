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
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">Inquiries</h2>
            <p className="text-sm text-muted-foreground">Manage and respond to customer inquiries.</p>
          </div>
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
            {inquiries.length} total
          </span>
        </div>

        {inquiries.length === 0 ? (
          <div className="rounded-xl border border-border bg-background py-10 text-center text-sm text-muted-foreground">
            No inquiries found.
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inq) => (
              <div key={inq.id} className="rounded-2xl border border-border bg-background p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-semibold text-foreground">
                      {inq.firstName} {inq.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{inq.email}</p>
                    {inq.message && (
                      <p className="text-sm text-foreground line-clamp-2">{inq.message}</p>
                    )}
                    <span className={`inline-block text-xs px-2.5 py-1 border rounded-full font-medium ${statusBadge(inq.status)}`}>
                      {inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedInquiry(inq)}
                      disabled={updatingId === inq.id}
                    >
                      View
                    </Button>
                    {inq.status !== "closed" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatus(inq.id, "closed")}
                        disabled={updatingId === inq.id}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border">
            <DialogTitle className="text-lg font-bold text-card-foreground">
              {selectedLiveInquiry?.firstName} {selectedLiveInquiry?.lastName}
              <span className={`ml-2 text-xs font-medium px-2 py-0.5 border rounded-full ${statusBadge(selectedLiveInquiry?.status ?? "pending")}`}>
                {selectedLiveInquiry?.status}
              </span>
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">{selectedLiveInquiry?.email}</p>
          </DialogHeader>

          {selectedLiveInquiry && (
            <>
              <ScrollArea className="h-64 border-b border-border px-6 py-4 bg-muted/30">
                {(selectedLiveInquiry.messages || []).length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">No messages yet.</p>
                ) : (
                  (selectedLiveInquiry.messages || []).map((m, i) => (
                    <div key={i} className={`mb-4 flex flex-col ${m.sender === "admin" ? "items-end" : "items-start"}`}>
                      <div className={`rounded-xl px-4 py-2 max-w-xs break-words text-sm ${
                        m.sender === "admin"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border text-foreground"
                      }`}>
                        {m.content}
                      </div>
                      <span className="text-xs mt-1 text-muted-foreground">
                        {m.sender === "admin" ? (m.senderName || "Admin") : (m.senderName || "Customer")}
                      </span>
                    </div>
                  ))
                )}
              </ScrollArea>

              <div className="p-6 flex flex-col gap-3">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="resize-none min-h-[72px]"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setSelectedInquiry(null)}>
                    Cancel
                  </Button>
                  <Button onClick={sendReply} disabled={sendingReply || !replyText.trim()}>
                    {sendingReply ? "Sending..." : "Send Reply"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}