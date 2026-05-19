import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import {
  Check,
  Clock,
  MessageSquareText,
  Search,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { db } from "../../utils/firebase/config";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

type ReviewStatus = "pending" | "approved" | "declined";
type FilterStatus = "all" | ReviewStatus;

type AdminReview = {
  id: string;
  displayName: string;
  isAnonymous: boolean;
  rating: number;
  message: string;
  status: ReviewStatus;
  createdAt?: Timestamp | Date | string | null;
  updatedAt?: Timestamp | Date | string | null;
};

const FILTER_OPTIONS: FilterStatus[] = [
  "pending",
  "approved",
  "declined",
  "all",
];

function isReviewStatus(status: unknown): status is ReviewStatus {
  return status === "pending" || status === "approved" || status === "declined";
}

function getTimestampMillis(value: unknown): number {
  if (!value) return 0;

  if (typeof (value as any)?.toMillis === "function") {
    return (value as any).toMillis();
  }

  if (typeof (value as any)?.toDate === "function") {
    return (value as any).toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value as string).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(value: unknown): string {
  const millis = getTimestampMillis(value);

  if (!millis) return "No date";

  return new Date(millis).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function normalizeReview(
  id: string,
  data: Record<string, unknown>
): AdminReview {
  const rating = Number(data.rating);

  return {
    id,
    displayName:
      typeof data.displayName === "string" && data.displayName.trim()
        ? data.displayName.trim()
        : "Anonymous",
    isAnonymous: data.isAnonymous === true,
    rating:
      Number.isFinite(rating) && rating >= 1 && rating <= 5
        ? Math.round(rating)
        : 5,
    message:
      typeof data.message === "string" && data.message.trim()
        ? data.message.trim()
        : "No review message provided.",
    status: isReviewStatus(data.status) ? data.status : "pending",
    createdAt: (data.createdAt as Timestamp | Date | string | null) ?? null,
    updatedAt: (data.updatedAt as Timestamp | Date | string | null) ?? null,
  };
}

function statusBadge(status: ReviewStatus): string {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "declined") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function formatStatus(status: ReviewStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`h-4 w-4 ${
            value <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-stone-300"
          }`}
        />
      ))}
    </div>
  );
}

export function AdminReviews() {
  const { user, role, loading: authLoading } = useAuth();

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user || role !== "admin") {
      setReviews([]);
      setError("Only administrators can manage reviews.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const q = query(collection(db, "reviews"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const mapped = snapshot.docs
          .map((document) => normalizeReview(document.id, document.data()))
          .sort(
            (a, b) =>
              getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt)
          );

        setReviews(mapped);
        setError("");
        setLoading(false);
      },
      (listenerError) => {
        console.error("Admin reviews listener error:", listenerError);
        setReviews([]);
        setError(listenerError.message || "Failed to load reviews.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user, role]);

  const filteredReviews = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesStatus = filter === "all" || review.status === filter;

      const searchableText = [
        review.displayName,
        review.message,
        review.status,
        review.id,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!keyword || searchableText.includes(keyword));
    });
  }, [reviews, filter, searchTerm]);

  const stats = {
    total: reviews.length,
    pending: reviews.filter((review) => review.status === "pending").length,
    approved: reviews.filter((review) => review.status === "approved").length,
    declined: reviews.filter((review) => review.status === "declined").length,
  };

  const handleStatusChange = async (
    reviewId: string,
    nextStatus: "approved" | "declined"
  ) => {
    if (updatingId) return;

    setUpdatingId(reviewId);

    try {
      await updateDoc(doc(db, "reviews", reviewId), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
        approvedAt: nextStatus === "approved" ? serverTimestamp() : null,
        declinedAt: nextStatus === "declined" ? serverTimestamp() : null,
      });

      toast.success(
        nextStatus === "approved" ? "Review approved" : "Review declined"
      );
    } catch (updateError) {
      console.error("Review status update error:", updateError);

      const message =
        updateError instanceof Error
          ? updateError.message
          : "Failed to update review.";

      setError(message);

      toast.error("Update failed", {
        description: message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
        Loading reviews...
      </div>
    );
  }

  return (
    <div className="page-fade-in space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Review Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-card-foreground md:text-3xl">
          Customer Reviews
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Approve or decline submitted reviews before they appear on the
          homepage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total" value={stats.total} />
        <SummaryCard label="Pending" value={stats.pending} highlight />
        <SummaryCard label="Approved" value={stats.approved} />
        <SummaryCard label="Declined" value={stats.declined} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-card-foreground">
              Review Submissions
            </h2>

            <p className="text-sm text-muted-foreground">
              Showing {filteredReviews.length} review
              {filteredReviews.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search reviews..."
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as FilterStatus)}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              aria-label="Filter reviews"
            >
              {FILTER_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All Reviews" : formatStatus(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {filteredReviews.length === 0 ? (
          <div className="rounded-xl border border-border bg-background py-12 text-center">
            <MessageSquareText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No reviews found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-border bg-background p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {review.displayName}
                      </p>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(
                          review.status
                        )}`}
                      >
                        {formatStatus(review.status)}
                      </span>

                      {review.isAnonymous && (
                        <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                          Anonymous
                        </span>
                      )}
                    </div>

                    <RatingStars rating={review.rating} />

                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      {review.message}
                    </p>

                    <p className="mt-3 text-xs text-muted-foreground">
                      Submitted: {formatDate(review.createdAt)}
                    </p>
                  </div>

                  {review.status === "pending" && (
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(review.id, "approved")
                        }
                        disabled={updatingId === review.id}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Approve
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleStatusChange(review.id, "declined")
                        }
                        disabled={updatingId === review.id}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight ? "border-amber-200 bg-amber-50" : "border-border bg-card"
      }`}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-primary">
        <Clock className="h-5 w-5" />
      </div>

      <p className="text-sm text-muted-foreground">{label}</p>
      <h3 className="mt-1 text-2xl font-bold text-card-foreground">{value}</h3>
    </div>
  );
}