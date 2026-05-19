import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { useAuth } from "../context/AuthContext";
import { db } from "../../utils/firebase/config";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

import type { Inquiry } from "../../types/inquiry";

type AdminInquiry = Inquiry & {
  fullName?: string;
  phone?: string;
  customerType?: "guest" | "registered";
  adminRead?: boolean;
  adminReadAt?: unknown;
};

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

function readBadge(adminRead: unknown) {
  if (adminRead === true) {
    return "bg-stone-50 text-stone-600 border-stone-200";
  }

  return "bg-red-50 text-red-700 border-red-200";
}

function customerTypeBadge(customerType: unknown) {
  if (customerType === "guest") {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }

  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function getCustomerName(inq: AdminInquiry) {
  if (inq.fullName && inq.fullName.trim()) {
    return inq.fullName;
  }

  const combinedName = `${inq.firstName || ""} ${inq.lastName || ""}`.trim();

  return combinedName || "Unknown Customer";
}

function normalizeInquiry(id: string, data: any): AdminInquiry {
  const customerType =
    data.customerType === "guest" ? "guest" : "registered";

  return {
    id,
    ...data,
    firstName: typeof data.firstName === "string" ? data.firstName : "",
    lastName: typeof data.lastName === "string" ? data.lastName : "",
    fullName: typeof data.fullName === "string" ? data.fullName : "",
    email: typeof data.email === "string" ? data.email : "",
    phone: typeof data.phone === "string" ? data.phone : "",
    message: typeof data.message === "string" ? data.message : "",
    inquiryType:
      typeof data.inquiryType === "string" && data.inquiryType.trim()
        ? data.inquiryType
        : "General Inquiry",
    customerType,
    adminRead: data.adminRead === true,
    adminReadAt: data.adminReadAt ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  } as AdminInquiry;
}

export function AdminInquiries() {
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiry | null>(
    null
  );

  const { user, role, loading: authLoading } = useAuth();

  const selectedLiveInquiry = selectedInquiry
    ? inquiries.find((inq) => inq.id === selectedInquiry.id) || selectedInquiry
    : null;

  const totalCount = inquiries.length;
  const unreadCount = inquiries.filter((inq) => inq.adminRead !== true).length;
  const readCount = inquiries.filter((inq) => inq.adminRead === true).length;
  const guestCount = inquiries.filter(
    (inq) => inq.customerType === "guest"
  ).length;
  const registeredCount = inquiries.filter(
    (inq) => inq.customerType !== "guest"
  ).length;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setInquiries([]);
      setError("You must be logged in as admin to view inquiries.");
      setLoading(false);
      return;
    }

    if (role !== "admin") {
      setInquiries([]);
      setError("Access denied. Only administrators can view inquiries.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const unsubscribe = onSnapshot(
      collection(db, "inquiries"),
      (snapshot) => {
        try {
          const data = snapshot.docs
            .map((document) => normalizeInquiry(document.id, document.data()))
            .sort(
              (a, b) =>
                getTimestampMillis(b.createdAt) -
                getTimestampMillis(a.createdAt)
            );

          setInquiries(data);
          setError("");
        } catch (err) {
          console.error("Inquiry parsing error:", err);
          setError("Some inquiry records contain invalid data.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Inquiries listener error:", err);
        setInquiries([]);
        setError(err.message || "Failed to load inquiries.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user, role]);

  const handleViewInquiry = async (inq: AdminInquiry) => {
    setSelectedInquiry(inq);

    if (inq.adminRead === true) {
      return;
    }

    try {
      await updateDoc(doc(db, "inquiries", inq.id), {
        adminRead: true,
        adminReadAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to mark inquiry as read:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark inquiry as read."
      );
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
        Loading inquiries...
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
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">
              Inquiries
            </h2>
            <p className="text-sm text-muted-foreground">
              View guest and registered customer inquiries submitted through the
              system.
            </p>
          </div>

          <span className="w-fit rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
            {totalCount} total
          </span>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
          <SummaryCard label="Total" value={totalCount} />
          <SummaryCard label="Unread" value={unreadCount} highlight />
          <SummaryCard label="Read" value={readCount} />
          <SummaryCard label="Guest" value={guestCount} />
          <SummaryCard label="Registered" value={registeredCount} />
        </div>

        {inquiries.length === 0 ? (
          <div className="rounded-xl border border-border bg-background py-10 text-center text-sm text-muted-foreground">
            No inquiries found.
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                className={`rounded-2xl border p-4 sm:p-5 ${
                  inq.adminRead === true
                    ? "border-border bg-background"
                    : "border-red-200 bg-red-50/40"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {getCustomerName(inq)}
                      </p>

                      <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${readBadge(
                          inq.adminRead
                        )}`}
                      >
                        {inq.adminRead ? "Read" : "Unread"}
                      </span>

                      <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${customerTypeBadge(
                          inq.customerType
                        )}`}
                      >
                        {inq.customerType === "guest" ? "Guest" : "Registered"}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {inq.email || "No email provided"}
                    </p>

                    {inq.phone && (
                      <p className="text-sm text-muted-foreground">
                        {inq.phone}
                      </p>
                    )}

                    <p className="text-sm font-medium text-foreground">
                      {inq.inquiryType || "General Inquiry"}
                    </p>

                    {inq.message && (
                      <p className="line-clamp-2 text-sm text-foreground">
                        {inq.message}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Submitted: {formatDate(inq.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant={inq.adminRead ? "outline" : "default"}
                      onClick={() => handleViewInquiry(inq)}
                    >
                      View
                    </Button>
                  </div>
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
            <DialogTitle className="text-lg font-bold text-card-foreground">
              Inquiry Details
            </DialogTitle>
          </DialogHeader>

          {selectedLiveInquiry && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${readBadge(
                    selectedLiveInquiry.adminRead
                  )}`}
                >
                  {selectedLiveInquiry.adminRead ? "Read" : "Unread"}
                </span>

                <span
                  className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${customerTypeBadge(
                    selectedLiveInquiry.customerType
                  )}`}
                >
                  {selectedLiveInquiry.customerType === "guest"
                    ? "Guest"
                    : "Registered"}
                </span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Customer Name</p>
                <p className="font-medium text-foreground">
                  {getCustomerName(selectedLiveInquiry)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">
                  {selectedLiveInquiry.email || "No email provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">
                  {selectedLiveInquiry.phone || "No phone provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Inquiry Type</p>
                <p className="font-medium text-foreground">
                  {selectedLiveInquiry.inquiryType || "General Inquiry"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Submitted At</p>
                <p className="font-medium text-foreground">
                  {formatDate(selectedLiveInquiry.createdAt)}
                </p>
              </div>

              {selectedLiveInquiry.adminReadAt !== null &&
                selectedLiveInquiry.adminReadAt !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Read At</p>
                    <p className="font-medium text-foreground">
                      {formatDate(selectedLiveInquiry.adminReadAt)}
                    </p>
                  </div>
                )}

              <div>
                <p className="text-sm text-muted-foreground">Message</p>
                <p className="mt-1 whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
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

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-border bg-background text-foreground"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}