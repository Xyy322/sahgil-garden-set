import { Link } from "react-router-dom";
import {
  ArrowRight,
  Armchair,
  Award,
  CheckCircle,
  Clock,
  Leaf,
  Palette,
  ShieldCheck,
  Star,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ReviewSection } from "../components/ReviewsSection";

const galleryItems = [
  {
    title: "Garden Furniture",
    image:
      "https://images.unsplash.com/photo-1766852092602-3d5791b1e028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    title: "Landscaping",
    image:
      "https://images.unsplash.com/photo-1663185777721-a53e090dfecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    title: "Outdoor Design",
    image:
      "https://images.unsplash.com/photo-1759008348522-2330a9cc4d96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    title: "Garden Setup",
    image:
      "https://images.unsplash.com/photo-1770234848941-8bd67b57d700?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
];

const testimonials = [
  {
    name: "Customer Feedback",
    role: "Garden Furniture Order",
    message:
      "The online system makes it easier to browse products and send order details without needing to visit the shop immediately.",
    rating: 5,
  },
  {
    name: "Customer Feedback",
    role: "Appointment Request",
    message:
      "The appointment request process is simple to understand and helps customers know the status of their schedule.",
    rating: 5,
  },
  {
    name: "Staff Feedback",
    role: "Business Monitoring",
    message:
      "The system helps organize customer information, orders, appointments, and inquiries in one place.",
    rating: 5,
  },
];

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < rating
              ? "fill-amber-400 text-amber-400"
              : "text-stone-300"
          }`}
        />
      ))}
    </div>
  );
}

export function Home() {
  return (
    <div className="page-fade-in flex w-full flex-col">
      <section className="relative h-[85vh] min-h-[680px] w-full overflow-hidden bg-stone-900">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1766852092602-3d5791b1e028"
            alt="Garden furniture"
            className="h-full w-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/50 to-stone-900/20" />
        </div>

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-4 pt-20 text-center sm:px-6 lg:px-8">
          <span className="mb-6 inline-block rounded-full border border-emerald-500/30 bg-emerald-900/50 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-emerald-300 backdrop-blur-sm">
            Garden Furniture & Landscaping
          </span>

          <h1 className="mb-6 max-w-4xl text-balance text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
            Transform Your Garden into a{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Better Outdoor Space
            </span>
          </h1>

          <p className="mb-10 max-w-2xl text-xl font-light leading-relaxed text-stone-200 md:text-2xl">
            Browse garden furniture, send order requests, and schedule
            landscaping consultations through one convenient online system.
          </p>

          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <Link
              to="/services"
              className="button-press group inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-emerald-600/30 transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/40"
            >
              Browse Products
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/services#landscaping"
              className="button-press inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-4 text-lg font-medium text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              Request Appointment
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f9f7f4] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Gallery
            </p>

            <h2 className="mb-4 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Outdoor Products and Services
            </h2>

            <p className="text-lg leading-relaxed text-stone-600">
              Explore the type of garden furniture, outdoor setup, and
              landscaping services that customers can inquire about through the
              system.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {galleryItems.map((item) => (
              <div
                key={item.title}
                className="group overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-64 overflow-hidden">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 to-transparent" />
                  <p className="absolute bottom-4 left-4 text-lg font-bold text-white">
                    {item.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-stone-100 bg-[#f9f7f4] py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Why Choose Us
            </p>

            <h2 className="mb-6 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              Why Choose Sahgil Garden Set?
            </h2>

            <p className="mb-10 text-lg leading-relaxed text-stone-600">
              Sahgil Garden Set focuses on organized service, quality products,
              and clear communication with customers from order request to
              appointment confirmation.
            </p>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>

                <div>
                  <h4 className="mb-2 text-xl font-bold text-stone-800">
                    Organized Transactions
                  </h4>
                  <p className="leading-relaxed text-stone-600">
                    Orders, appointment requests, customer details, and
                    inquiries are stored in one centralized system.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <Award className="h-6 w-6 text-emerald-600" />
                </div>

                <div>
                  <h4 className="mb-2 text-xl font-bold text-stone-800">
                    Product and Service Quality
                  </h4>
                  <p className="leading-relaxed text-stone-600">
                    Customers can browse garden furniture products and request
                    landscaping consultation through a clear online process.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <Clock className="h-6 w-6 text-emerald-600" />
                </div>

                <div>
                  <h4 className="mb-2 text-xl font-bold text-stone-800">
                    Better Scheduling
                  </h4>
                  <p className="leading-relaxed text-stone-600">
                    Appointment requests use selected-date reservations to help
                    reduce overlapping schedules.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl shadow-2xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1770234848941-8bd67b57d700?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080"
              alt="Beautiful landscaped garden patio"
              className="aspect-square h-full w-full object-cover lg:aspect-[4/5]"
            />
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/10" />

            <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-5 shadow-xl backdrop-blur">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
                  <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
                </div>

                <div>
                  <p className="font-bold text-stone-900">
                    Highly Rated Experience
                  </p>
                  <p className="text-sm text-stone-500">
                    Positive evaluation from system respondents
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <RatingStars rating={5} />
                <span className="text-sm font-semibold text-stone-700">
                  Strongly Agree overall evaluation
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ReviewSection />

      <section className="relative bg-stone-100 py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
            Ready to Order or Request an Appointment?
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-stone-600">
            Browse available products, send a custom inquiry, or request a
            landscaping consultation schedule through the online platform.
          </p>

          <Link
            to="/services"
            className="group inline-flex items-center justify-center rounded-full bg-emerald-600 px-10 py-5 text-xl font-bold text-white shadow-xl shadow-emerald-600/20 transition-all hover:-translate-y-1 hover:bg-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/40"
          >
            Go to Services
            <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
          </Link>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm font-medium text-stone-500 sm:flex-row sm:gap-6">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Product ordering
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Appointment requests
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Customer inquiries
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}