import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

import { db } from "../../utils/firebase/config";
import { useAuth } from "../context/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

interface InquiryData {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  inquiryType: string;
  message: string;
  status: "pending" | "responded" | "closed";
  createdAt?: Timestamp | string | null;
  updatedAt?: Timestamp | string | null;
}

function formatDate(value: unknown) {
  if (!value) return "N/A";

  if (value instanceof Timestamp) {
    return value.toDate().toLocaleString();
  }

  if (typeof (value as any)?.toDate === "function") {
    return (value as any).toDate().toLocaleString();
  }

  const parsed = new Date(value as string).getTime();
  if (Number.isNaN(parsed)) return "N/A";

  return new Date(parsed).toLocaleString();
}

function getTimestampMillis(value: unknown): number {
  if (!value) return 0;

  if (value instanceof Timestamp) {
    return value.toMillis();
  }

  if (typeof (value as any)?.toMillis === "function") {
    return (value as any).toMillis();
  }

  const parsed = new Date(value as string).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function statusLabel(status: unknown) {
  if (status === "closed") return "Closed";
  if (status === "responded") return "Read";
  return "Submitted";
}

function statusBadge(status: unknown) {
  if (status === "closed") {
    return "bg-stone-100 text-stone-700 border-stone-200";
  }

  if (status === "responded") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  return "bg-amber-50 text-amber-700 border-amber-200";
}

function normalizeInquiry(id: string, data: any): InquiryData {
  const status =
    data.status === "responded" ||
    data.status === "closed" ||
    data.status === "pending"
      ? data.status
      : "pending";

  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    firstName: typeof data.firstName === "string" ? data.firstName : "",
    lastName: typeof data.lastName === "string" ? data.lastName : "",
    email: typeof data.email === "string" ? data.email : "",
    inquiryType:
      typeof data.inquiryType === "string" && data.inquiryType.trim()
        ? data.inquiryType
        : "General Inquiry",
    message: typeof data.message === "string" ? data.message : "",
    status,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

export function CustomerInquiries() {
  const [inquiries, setInquiries] = useState<InquiryData[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user, role, loading: authLoading } = useAuth();

  const selectedLiveInquiry = selectedInquiry
    ? inquiries.find((inq) => inq.id === selectedInquiry.id) || selectedInquiry
    : null;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || role !== "customer") {
      setInquiries([]);
      setLoading(false);
      setError("Only logged-in customers can view their inquiries.");
      return;
    }

    setLoading(true);
    setError("");

    const q = query(
      collection(db, "inquiries"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const mapped = snapshot.docs
            .map((document) => normalizeInquiry(document.id, document.data()))
            .sort(
              (a, b) =>
                getTimestampMillis(b.createdAt) -
                getTimestampMillis(a.createdAt)
            );

          setInquiries(mapped);
          setError("");
        } catch (err) {
          console.error("Customer inquiry parsing error:", err);
          setError("Some inquiry records contain invalid data.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Customer inquiries listener error:", err);
        setInquiries([]);
        setError(err.message || "Failed to load your inquiries.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user, role]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-stone-100 bg-white p-8 shadow-sm">
        Loading your inquiries...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">
              Your Inquiries
            </h2>
            <p className="text-sm text-stone-500">
              View the inquiries you submitted to Sahgil Garden Set.
            </p>
          </div>

          <span className="w-fit rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700">
            {inquiries.length} total
          </span>
        </div>

        {inquiries.length === 0 ? (
          <div className="rounded-xl border border-stone-100 bg-stone-50 py-12 text-center text-sm text-stone-500">
            No inquiries yet.
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="flex flex-col gap-4 rounded-2xl border border-stone-100 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-stone-800">
                      {inquiry.inquiryType || "General Inquiry"}
                    </h3>

                    <span
                      className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge(
                        inquiry.status
                      )}`}
                    >
                      {statusLabel(inquiry.status)}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-sm text-stone-600">
                    {inquiry.message || "No message provided."}
                  </p>

                  <p className="text-xs text-stone-400">
                    Submitted: {formatDate(inquiry.createdAt)}
                  </p>
                </div>

                <div className="shrink-0">
                  <Button
                    size="sm"
                    onClick={() => setSelectedInquiry(inquiry)}
                    className="h-9 px-4"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedInquiry}
        onOpenChange={(open) => {
          if (!open) setSelectedInquiry(null);
        }}
      >
        <DialogContent className="max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-stone-900">
              Inquiry Details
            </DialogTitle>
          </DialogHeader>

          {selectedLiveInquiry && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-stone-500">Inquiry Type</p>
                <p className="font-medium text-stone-800">
                  {selectedLiveInquiry.inquiryType || "General Inquiry"}
                </p>
              </div>

              <div>
                <p className="text-sm text-stone-500">Status</p>
                <span
                  className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(
                    selectedLiveInquiry.status
                  )}`}
                >
                  {statusLabel(selectedLiveInquiry.status)}
                </span>
              </div>

              <div>
                <p className="text-sm text-stone-500">Submitted At</p>
                <p className="font-medium text-stone-800">
                  {formatDate(selectedLiveInquiry.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-sm text-stone-500">Message</p>
                <p className="mt-1 whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed text-stone-700">
                  {selectedLiveInquiry.message || "No message provided."}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedInquiry(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}