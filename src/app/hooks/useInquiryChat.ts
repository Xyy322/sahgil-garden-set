import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  arrayUnion,
  Timestamp,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../utils/firebase/config";
import { getAuth } from "firebase/auth";
import type { Inquiry, Message, UseInquiryChatReturn } from "../../types/inquiry";
import { createNotification } from "../../utils/createNotification";

export function useInquiryChat(userEmail: string | null): UseInquiryChatReturn {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setInquiries([]);
      setSelectedInquiryId(null);
      setInquiry(null);
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const q = query(
      collection(db, "inquiries"),
      where("email", "==", userEmail),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setInquiries([]);
          setSelectedInquiryId(null);
          setInquiry(null);
          setMessages([]);
          setIsLoading(false);
          return;
        }

        const mapped = snap.docs.map(
          (d) =>
            ({
              id: d.id,
              ...(d.data() as Omit<Inquiry, "id">),
            } as Inquiry)
        );

        setInquiries(mapped);

        const active = mapped.find((inq) => inq.status !== "closed") || null;
        const latest = mapped[0] || null;

        setSelectedInquiryId((prev) => {
          if (prev && mapped.some((inq) => inq.id === prev)) return prev;
          return active?.id ?? latest?.id ?? null;
        });

        setIsLoading(false);
      },
      () => {
        setInquiries([]);
        setSelectedInquiryId(null);
        setInquiry(null);
        setMessages([]);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [userEmail]);

  useEffect(() => {
    if (!selectedInquiryId) {
      setInquiry(null);
      setMessages([]);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "inquiries", selectedInquiryId),
      (snap) => {
        if (!snap.exists()) {
          setInquiry(null);
          setMessages([]);
          return;
        }

        const selected = {
          id: snap.id,
          ...(snap.data() as Omit<Inquiry, "id">),
        } as Inquiry;

        setInquiry(selected);
        setMessages(selected.messages || []);

        setInquiries((prev) => {
          const idx = prev.findIndex((inq) => inq.id === selected.id);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = selected;
          return next;
        });
      },
      () => {
        setInquiry(null);
        setMessages([]);
      }
    );

    return () => unsub();
  }, [selectedInquiryId]);

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || !inquiry?.id) return;

    const auth = getAuth();
    const currentEmail = auth.currentUser?.email;
    if (!currentEmail) return;

    const msg: Message = {
      sender: "customer",
      content: trimmed,
      timestamp: Timestamp.now(),
      senderName: currentEmail,
    };

    await updateDoc(doc(db, "inquiries", inquiry.id), {
      messages: arrayUnion(msg),
      status: "responded",
    });

    const adminSnap = await getDocs(
      query(collection(db, "users"), where("role", "==", "admin"))
    );

    const inquiryType = inquiry.inquiryType || "Inquiry";

    await Promise.all(
      adminSnap.docs.map((adminDoc) =>
        createNotification({
          userId: adminDoc.id,
          title: `New ${inquiryType} message`,
          message: `Customer sent a new message in ${inquiryType.toLowerCase()} inquiry.`,
          type: "inquiry" as any,
          statusRefId: inquiry.id,
        })
      )
    );
  };

  const selectInquiry = (id: string) => {
    setSelectedInquiryId(id);
  };

  const refetch = () => {
    // No-op: data is realtime via onSnapshot.
  };

  return {
    inquiry,
    inquiries,
    selectedInquiryId,
    selectInquiry,
    messages,
    sendMessage,
    isLoading,
    isClosed: inquiry?.status === "closed",
    refetch,
  };
}
