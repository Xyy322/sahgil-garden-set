import { Link } from "react-router-dom";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { TreePine, Home, Ruler, Droplets } from "lucide-react";

export function About() {
  return (
    <div className="page-fade-in min-h-screen bg-[#f9f7f4]">
      <section className="relative flex h-[65vh] min-h-[500px] w-full items-center justify-center overflow-hidden bg-stone-900">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1759008348522-2330a9cc4d96"
            alt="Outdoor garden landscape"
            className="h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-stone-900/10" />
        </div>

        <div className="relative z-10 max-w-3xl px-4 text-center text-white">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
            About Sahgil Garden Set
          </p>

          <h1 className="mb-6 text-4xl font-bold md:text-6xl">
            Our Story
          </h1>

          <p className="text-lg leading-relaxed text-stone-200 md:text-xl">
            A local garden furniture and landscaping business committed to
            creating comfortable, durable, and beautiful outdoor spaces.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-24 grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="hover-lift order-2 overflow-hidden rounded-3xl shadow-2xl lg:order-1">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1663185777721-a53e090dfecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMHBhdGh8ZW58MXx8fHwxNzcyNzMxNjMxfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Garden landscaping pathway"
              className="aspect-square h-full w-full object-cover"
            />
          </div>

          <div className="order-1 lg:order-2">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Our Story
            </p>

            <h2 className="mb-6 text-3xl font-bold text-stone-900 md:text-4xl">
              Built from craftsmanship and service
            </h2>

            <p className="mb-6 text-lg leading-relaxed text-stone-600">
              Sahgil Garden Set provides garden furniture and landscaping
              services for customers who want to improve their outdoor spaces.
              The business focuses on practical, durable, and visually pleasing
              garden sets that can be used for homes, outdoor areas, and
              landscaping projects.
            </p>

            <p className="mb-8 text-lg leading-relaxed text-stone-600">
              Through this web-based system, the business can organize customer
              orders, appointment requests, inquiries, and records in one
              centralized platform. This helps reduce manual transactions and
              provides customers with a more convenient way to communicate with
              the business.
            </p>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Our Approach
              </p>

              <p className="mt-2 text-base leading-relaxed text-stone-700">
                We value quality work, clear communication, organized service,
                and customer satisfaction in every order and appointment.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-24 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card className="rounded-3xl border border-stone-100 bg-white p-8 shadow-sm md:p-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
              <TreePine className="h-7 w-7 text-emerald-700" />
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Mission
            </p>

            <h3 className="mb-4 text-2xl font-bold text-stone-900">
              To provide reliable outdoor products and services
            </h3>

            <p className="leading-relaxed text-stone-600">
              Our mission is to provide customers with durable garden furniture
              and organized landscaping consultation services through a more
              accessible and efficient online system. We aim to make ordering,
              appointment scheduling, and customer communication easier for both
              the business and its customers.
            </p>
          </Card>

          <Card className="rounded-3xl border border-stone-100 bg-white p-8 shadow-sm md:p-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
              <Home className="h-7 w-7 text-emerald-700" />
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Vision
            </p>

            <h3 className="mb-4 text-2xl font-bold text-stone-900">
              To become a trusted garden furniture and landscaping provider
            </h3>

            <p className="leading-relaxed text-stone-600">
              Our vision is to be recognized as a dependable local business
              that helps customers create comfortable and attractive outdoor
              spaces while continuously improving service quality through
              organized records, better communication, and digital
              transformation.
            </p>
          </Card>
        </div>

        <div>
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Core Values
            </p>

            <h2 className="mb-4 text-3xl font-bold text-stone-900">
              What Guides Our Work
            </h2>

            <p className="text-lg leading-relaxed text-stone-600">
              These values guide how Sahgil Garden Set handles products,
              services, appointments, and customer transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover-lift rounded-2xl border border-stone-100 bg-white p-8 text-center shadow-sm transition-all duration-300">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <TreePine className="h-8 w-8 text-emerald-600" />
              </div>

              <h3 className="mb-3 text-xl font-bold text-stone-800">
                Quality
              </h3>

              <p className="text-sm leading-relaxed text-stone-600">
                We aim to provide garden furniture and services that are useful,
                durable, and suited to customer needs.
              </p>
            </Card>

            <Card className="hover-lift rounded-2xl border border-stone-100 bg-white p-8 text-center shadow-sm transition-all duration-300">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <Ruler className="h-8 w-8 text-emerald-600" />
              </div>

              <h3 className="mb-3 text-xl font-bold text-stone-800">
                Precision
              </h3>

              <p className="text-sm leading-relaxed text-stone-600">
                We value proper details, clear customer information, and
                organized handling of orders and appointments.
              </p>
            </Card>

            <Card className="hover-lift rounded-2xl border border-stone-100 bg-white p-8 text-center shadow-sm transition-all duration-300">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <Home className="h-8 w-8 text-emerald-600" />
              </div>

              <h3 className="mb-3 text-xl font-bold text-stone-800">
                Service
              </h3>

              <p className="text-sm leading-relaxed text-stone-600">
                We focus on making customer transactions easier through proper
                communication and reliable service.
              </p>
            </Card>

            <Card className="hover-lift rounded-2xl border border-stone-100 bg-white p-8 text-center shadow-sm transition-all duration-300">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <Droplets className="h-8 w-8 text-emerald-600" />
              </div>

              <h3 className="mb-3 text-xl font-bold text-stone-800">
                Durability
              </h3>

              <p className="text-sm leading-relaxed text-stone-600">
                We consider long-term use, practicality, and customer
                satisfaction in the products and services we provide.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-emerald-900 px-4 py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
            Ready to Improve Your Outdoor Space?
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-emerald-100">
            Browse our products or send an inquiry so Sahgil Garden Set can
            assist you with your garden furniture and landscaping needs.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className="h-14 rounded-full bg-white px-8 text-lg font-bold text-emerald-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-stone-100 hover:shadow-xl"
            >
              <Link to="/services">Browse Products</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-14 rounded-full border-white/40 bg-transparent px-8 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
            >
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}