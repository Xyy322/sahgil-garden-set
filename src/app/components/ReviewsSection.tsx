import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  type Timestamp,
} from "firebase/firestore";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  Send,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { db } from "../../utils/firebase/config";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type PublicReview = {
  id: string;
  displayName: string;
  isAnonymous: boolean;
  rating: number;
  message: string;
  status: "approved";
  createdAt?: Timestamp | Date | string | null;
};

function getTimestampMillis(value: unknown): number {
  if (!value) return 0;

  if (typeof (value as { toMillis?: unknown })?.toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }

  if (typeof (value as { toDate?: unknown })?.toDate === "function") {
    return (value as { toDate: () => Date }).toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value as string).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeReview(
  id: string,
  data: Record<string, unknown>
): PublicReview {
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

    status: "approved",

    createdAt: (data.createdAt as Timestamp | Date | string | null) ?? null,
  };
}

function RatingStars({
  rating,
  onChange,
  size = "h-5 w-5",
}: {
  rating: number;
  onChange?: (rating: number) => void;
  size?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => {
        const active = value <= rating;

        if (onChange) {
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className="rounded-full p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
            >
              <Star
                className={`${size} ${
                  active
                    ? "fill-amber-400 text-amber-400"
                    : "text-stone-300"
                }`}
              />
            </button>
          );
        }

        return (
          <Star
            key={value}
            className={`${size} ${
              active ? "fill-amber-400 text-amber-400" : "text-stone-300"
            }`}
          />
        );
      })}
    </div>
  );
}

export function ReviewSection() {
  const { user, profile } = useAuth();

  const suggestedName =
    profile?.fullName?.trim() || user?.displayName?.trim() || "";

  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const [displayName, setDisplayName] = useState(suggestedName);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (suggestedName && !displayName) {
      setDisplayName(suggestedName);
    }
  }, [suggestedName, displayName]);

  useEffect(() => {
    const q = query(
      collection(db, "reviews"),
      where("status", "==", "approved")
    );

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
        setReviewsError("");
        setLoadingReviews(false);
      },
      (error) => {
        console.error("Approved reviews listener error:", error);
        setReviews([]);
        setReviewsError("Unable to load approved reviews.");
        setLoadingReviews(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setCurrentIndex((prev) => {
      if (reviews.length === 0) return 0;
      return Math.min(prev, reviews.length - 1);
    });
  }, [reviews.length]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  const currentReview = reviews[currentIndex] || null;

  const handlePrevious = () => {
    if (reviews.length === 0) return;

    setCurrentIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (reviews.length === 0) return;

    setCurrentIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  const resetForm = () => {
    setMessage("");
    setRating(5);
    setIsAnonymous(false);
    setDisplayName(suggestedName);
    setFormError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (submitting) return;

    const cleanMessage = message.trim();
    const cleanName = isAnonymous
      ? "Anonymous"
      : (displayName.trim() || suggestedName).trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setFormError("Please select a rating from 1 to 5 stars.");
      return;
    }

    if (!isAnonymous && !cleanName) {
      setFormError("Please enter your name or choose anonymous.");
      return;
    }

    if (cleanMessage.length < 10) {
      setFormError("Review message must be at least 10 characters.");
      return;
    }

    if (cleanMessage.length > 300) {
      setFormError("Review message must not exceed 300 characters.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      await addDoc(collection(db, "reviews"), {
        displayName: isAnonymous ? "Anonymous" : cleanName,
        isAnonymous,
        rating,
        message: cleanMessage,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        approvedAt: null,
        declinedAt: null,
      });

      resetForm();
      setIsReviewModalOpen(false);

      toast.success("Review submitted", {
        description:
          "Your review was sent for admin approval before appearing on the homepage.",
      });
    } catch (error) {
      console.error("Review submission error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit review. Please try again.";

      setFormError(errorMessage);

      toast.error("Review failed", {
        description: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-emerald-900 py-20 text-white">
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="review-leaf-pattern"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M30 0C30 16.5685 16.5685 30 0 30C16.5685 30 30 43.4315 30 60C30 43.4315 43.4315 30 60 30C43.4315 30 30 16.5685 30 0Z"
                fill="currentColor"
              />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#review-leaf-pattern)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-300">
              Customer Reviews
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Ratings and Feedback
            </h2>

            <p className="mt-3 text-base leading-relaxed text-emerald-100/80 md:text-lg">
              Approved customer reviews appear here after admin moderation.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="h-12 rounded-xl bg-white px-6 font-bold text-emerald-900 hover:bg-stone-100"
          >
            <MessageSquarePlus className="mr-2 h-5 w-5" />
            Add Review
          </Button>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md md:p-8">
          {loadingReviews ? (
            <p className="text-emerald-100">Loading approved reviews...</p>
          ) : reviewsError ? (
            <p className="text-red-100">{reviewsError}</p>
          ) : reviews.length === 0 ? (
            <div className="text-center">
              <MessageSquarePlus className="mx-auto mb-4 h-12 w-12 text-emerald-300" />

              <h3 className="mb-2 text-xl font-bold text-white">
                No approved reviews yet
              </h3>

              <p className="text-emerald-100/80">
                Be the first to submit a review. It will appear here after admin
                approval.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <RatingStars rating={Math.round(averageRating)} />

                    <span className="text-sm font-semibold text-emerald-100">
                      {averageRating.toFixed(1)} / 5
                    </span>
                  </div>

                  <p className="text-sm text-emerald-100/70">
                    Based on {reviews.length} approved review
                    {reviews.length === 1 ? "" : "s"}
                  </p>
                </div>

                {reviews.length > 1 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                      aria-label="Previous review"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                      aria-label="Next review"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {currentReview && (
                <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                  <RatingStars rating={currentReview.rating} />

                  <p className="mt-5 text-lg font-light leading-relaxed text-emerald-50">
                    “{currentReview.message}”
                  </p>

                  <div className="mt-6 border-t border-white/10 pt-4">
                    <p className="font-semibold text-white">
                      {currentReview.displayName}
                    </p>

                    <p className="text-sm text-emerald-300">
                      Approved Customer Review
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog
        open={isReviewModalOpen}
        onOpenChange={(open) => {
          setIsReviewModalOpen(open);

          if (!open && !submitting) {
            setFormError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Review</DialogTitle>

            <DialogDescription>
              Your review will be checked by the admin before it appears on the
              homepage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-stone-700">
                Rating
              </label>

              <RatingStars
                rating={rating}
                onChange={setRating}
                size="h-7 w-7"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(event) => setIsAnonymous(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                disabled={submitting}
              />

              <span>
                Submit as anonymous
                <span className="mt-1 block text-xs font-normal text-stone-500">
                  Anonymous reviews will show as “Anonymous” after approval.
                </span>
              </span>
            </label>

            {!isAnonymous && (
              <div>
                <label
                  htmlFor="reviewerName"
                  className="mb-2 block text-sm font-semibold text-stone-700"
                >
                  Display Name
                </label>

                <input
                  id="reviewerName"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Enter your name"
                  maxLength={80}
                  disabled={submitting}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="reviewMessage"
                className="mb-2 block text-sm font-semibold text-stone-700"
              >
                Review Message
              </label>

              <textarea
                id="reviewMessage"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write your review..."
                minLength={10}
                maxLength={300}
                rows={4}
                disabled={submitting}
                className="w-full resize-none rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-2 text-right text-xs text-stone-500">
                {message.length}/300
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReviewModalOpen(false)}
                disabled={submitting}
                className="rounded-xl"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700"
              >
                <Send className="mr-2 h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}