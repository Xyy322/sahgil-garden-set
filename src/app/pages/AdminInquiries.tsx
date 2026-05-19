import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { Mail, MessageSquare, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
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

type ReadFilter = "All" | "Unread" | "Read";
type CustomerTypeFilter = "All" | "Guest" | "Registered";

const INQUIRIES_PER_PAGE = 5;

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

function getCustomerName(inquiry: AdminInquiry) {
  if (inquiry.fullName && inquiry.fullName.trim()) {
    return inquiry.fullName;
  }

  const combinedName = `${inquiry.firstName || ""} ${
    inquiry.lastName || ""
  }`.trim();

  return combinedName || "Unknown Customer";
}

function normalizeInquiry(id: string, data: any): AdminInquiry {
  const customerType = data.customerType === "guest" ? "guest" : "registered";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("All");
  const [customerTypeFilter, setCustomerTypeFilter] =
    useState<CustomerTypeFilter>("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiry | null>(
    null
  );

  const { user, role, loading: authLoading } = useAuth();

  const selectedLiveInquiry = selectedInquiry
    ? inquiries.find((inquiry) => inquiry.id === selectedInquiry.id) ||
      selectedInquiry
    : null;

  const totalCount = inquiries.length;
  const unreadCount = inquiries.filter(
    (inquiry) => inquiry.adminRead !== true
  ).length;
  const readCount = inquiries.filter(
    (inquiry) => inquiry.adminRead === true
  ).length;
  const guestCount = inquiries.filter(
    (inquiry) => inquiry.customerType === "guest"
  ).length;
  const registeredCount = inquiries.filter(
    (inquiry) => inquiry.customerType !== "guest"
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

  const filteredInquiries = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return inquiries.filter((inquiry) => {
      const matchesRead =
        readFilter === "All" ||
        (readFilter === "Read" && inquiry.adminRead === true) ||
        (readFilter === "Unread" && inquiry.adminRead !== true);

      const matchesType =
        customerTypeFilter === "All" ||
        (customerTypeFilter === "Guest" &&
          inquiry.customerType === "guest") ||
        (customerTypeFilter === "Registered" &&
          inquiry.customerType !== "guest");

      const searchableText = [
        getCustomerName(inquiry),
        inquiry.email,
        inquiry.phone,
        inquiry.inquiryType,
        inquiry.message,
        inquiry.customerType,
        inquiry.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);

      return matchesRead && matchesType && matchesSearch;
    });
  }, [inquiries, searchTerm, readFilter, customerTypeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInquiries.length / INQUIRIES_PER_PAGE)
  );

  const pageStartIndex = (currentPage - 1) * INQUIRIES_PER_PAGE;
  const pageEndIndex = Math.min(
    pageStartIndex + INQUIRIES_PER_PAGE,
    filteredInquiries.length
  );

  const paginatedInquiries = filteredInquiries.slice(
    pageStartIndex,
    pageEndIndex
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, readFilter, customerTypeFilter]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const handleViewInquiry = async (inquiry: AdminInquiry) => {
    setSelectedInquiry(inquiry);

    if (inquiry.adminRead === true) {
      return;
    }

    try {
      await updateDoc(doc(db, "inquiries", inquiry.id), {
        adminRead: true,
        adminReadAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Inquiry marked as read", {
  description: "This inquiry has been updated successfully.",
});
    } catch (err) {
      console.error("Failed to mark inquiry as read:", err);
      const message =
  err instanceof Error
    ? err.message
    : "Failed to mark inquiry as read.";

setError(message);

toast.error("Failed to update inquiry", {
  description: message,
});
    }
  };

  if (loading || authLoading) {
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
    <div className="page-fade-in space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Inquiry Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-card-foreground md:text-3xl">
          Customer Inquiries
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          View guest and registered customer inquiries submitted through the
          contact page.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <SummaryCard label="Total" value={totalCount} />
        <SummaryCard label="Unread" value={unreadCount} highlight />
        <SummaryCard label="Read" value={readCount} />
        <SummaryCard label="Guest" value={guestCount} />
        <SummaryCard label="Registered" value={registeredCount} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-card-foreground">
              Recent Inquiries
            </h2>
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {filteredInquiries.length === 0
                ? "0"
                : `${pageStartIndex + 1}-${pageEndIndex}`}{" "}
              of {filteredInquiries.length} filtered inquiry
              {filteredInquiries.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:max-w-3xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search name, email, phone, type, or message..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select
                value={readFilter}
                onChange={(event) =>
                  setReadFilter(event.target.value as ReadFilter)
                }
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                aria-label="Filter inquiries by read status"
              >
                <option value="All">All Read Status</option>
                <option value="Unread">Unread Only</option>
                <option value="Read">Read Only</option>
              </select>

              <select
                value={customerTypeFilter}
                onChange={(event) =>
                  setCustomerTypeFilter(
                    event.target.value as CustomerTypeFilter
                  )
                }
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                aria-label="Filter inquiries by customer type"
              >
                <option value="All">All Customer Types</option>
                <option value="Guest">Guest Only</option>
                <option value="Registered">Registered Only</option>
              </select>
            </div>
          </div>
        </div>

        {filteredInquiries.length === 0 ? (
          <div className="rounded-xl border border-border bg-background py-10 text-center text-sm text-muted-foreground">
            No inquiries found.
          </div>
        ) : (
          <div className="max-h-[720px] space-y-3 overflow-y-auto pr-2">
            {paginatedInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className={`rounded-2xl border p-4 shadow-sm ${
                  inquiry.adminRead === true
                    ? "border-border bg-background"
                    : "border-red-200 bg-red-50/40"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {getCustomerName(inquiry)}
                      </p>

                      <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${readBadge(
                          inquiry.adminRead
                        )}`}
                      >
                        {inquiry.adminRead ? "Read" : "Unread"}
                      </span>

                      <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${customerTypeBadge(
                          inquiry.customerType
                        )}`}
                      >
                        {inquiry.customerType === "guest"
                          ? "Guest"
                          : "Registered"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
                      <span className="inline-flex items-center gap-1.5 break-all">
                        <Mail className="h-4 w-4 shrink-0" />
                        {inquiry.email || "No email provided"}
                      </span>

                      {inquiry.phone && (
                        <span>{inquiry.phone}</span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-foreground">
                      {inquiry.inquiryType || "General Inquiry"}
                    </p>

                    {inquiry.message && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {inquiry.message}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Submitted: {formatDate(inquiry.createdAt)}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant={inquiry.adminRead ? "outline" : "default"}
                    onClick={() => handleViewInquiry(inquiry)}
                    className="w-full shrink-0 sm:w-auto"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredInquiries.length > INQUIRIES_PER_PAGE && (
          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedInquiry}
        onOpenChange={(open) => {
          if (!open) setSelectedInquiry(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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

              <DetailRow
                label="Customer Name"
                value={getCustomerName(selectedLiveInquiry)}
              />

              <DetailRow
                label="Email"
                value={selectedLiveInquiry.email || "No email provided"}
              />

              <DetailRow
                label="Phone"
                value={selectedLiveInquiry.phone || "No phone provided"}
              />

              <DetailRow
                label="Inquiry Type"
                value={selectedLiveInquiry.inquiryType || "General Inquiry"}
              />

              <DetailRow
                label="Submitted At"
                value={formatDate(selectedLiveInquiry.createdAt)}
              />

              {selectedLiveInquiry.adminReadAt !== null &&
                selectedLiveInquiry.adminReadAt !== undefined && (
                  <DetailRow
                    label="Read At"
                    value={formatDate(selectedLiveInquiry.adminReadAt)}
                  />
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
      className={`min-w-0 rounded-2xl border p-4 shadow-sm ${
        highlight
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-border bg-card text-foreground"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="break-words font-medium text-foreground">{value}</p>
    </div>
  );
}