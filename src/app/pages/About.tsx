// Import navigation, image, and icon components for use in the About page.
import { Link } from "react-router-dom";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { TreePine, Home, Ruler, Droplets } from "lucide-react";

// The About page provides the company story, values, and philosophy.
// It helps users understand the brand, its origins, and what makes it unique.
// This page is informational and does not directly affect application state, but it builds trust and context for users.
export function About() {
  return (
    <div className="min-h-screen bg-[#f9f7f4]">

      {/* HERO (MEDIUM STANDARD) */}
      <section className="relative w-full h-[65vh] min-h-[500px] bg-stone-900 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1759008348522-2330a9cc4d96"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/20" />
        </div>

        <div className="relative z-10 text-center text-white px-4 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Our Story</h1>
          <p className="text-lg md:text-xl text-stone-200">
            From workshop to full outdoor living studio.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          {/* Image */}
          <div className="order-2 lg:order-1 relative rounded-3xl overflow-hidden shadow-2xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1663185777721-a53e090dfecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMHBhdGh8ZW58MXx8fHwxNzcyNzMxNjMxfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Craftsman working"
              className="w-full h-full object-cover aspect-square"
            />
          </div>

          {/* Text */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold text-stone-800 mb-6">
              Rooted in Craftsmanship
            </h2>

            <p className="text-lg text-stone-600 mb-6 leading-relaxed">
              Founded in 2020 by Mr. Gilbert Rosales, Sahgil Garden Set
              began with a simple mission: to build outdoor furniture
              that actually lasts. After years of seeing clients struggle
              to find landscaping services that matched the quality of
              our furniture, we decided to expand.
            </p>

            <p className="text-lg text-stone-600 leading-relaxed mb-8">
              Today, we offer a seamless integration of bespoke furniture
              design and expert landscape architecture. We believe your
              garden should be a natural extension of your home, a place
              of rest, entertainment, and beauty.
            </p>

            <div className="pt-4 border-t border-stone-200">
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">
                Our Approach
              </p>

              <p className="text-base text-stone-700 mt-2">
                Quality, precision, and vision in every project we
                undertake.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-800 mb-4">
              Our Core Values
            </h2>

            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              The principles that guide every cut, planting, and
              consultation we provide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Sustainability */}
            <Card className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <TreePine className="w-8 h-8 text-emerald-600" />
              </div>

              <h3 className="text-xl font-bold text-stone-800 mb-3">
                Sustainability
              </h3>

              <p className="text-stone-600 text-sm leading-relaxed">
                We ensure that the quality of our materials and build
                meet the highest standards, creating furniture and
                landscapes that endure.
              </p>
            </Card>

            {/* Precision */}
            <Card className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ruler className="w-8 h-8 text-emerald-600" />
              </div>

              <h3 className="text-xl font-bold text-stone-800 mb-3">
                Precision
              </h3>

              <p className="text-stone-600 text-sm leading-relaxed">
                Measure twice, cut once. Our meticulous attention to
                detail ensures longevity in both furniture and
                hardscaping.
              </p>
            </Card>

            {/* Livability */}
            <Card className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home className="w-8 h-8 text-emerald-600" />
              </div>

              <h3 className="text-xl font-bold text-stone-800 mb-3">
                Livability
              </h3>

              <p className="text-stone-600 text-sm leading-relaxed">
                Gardens are meant to be used, not just admired. We
                design for comfort and real-world utility in every
                space.
              </p>
            </Card>

            {/* Durability */}
            <Card className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Droplets className="w-8 h-8 text-emerald-600" />
              </div>

              <h3 className="text-xl font-bold text-stone-800 mb-3">
                Durability
              </h3>

              <p className="text-stone-600 text-sm leading-relaxed">
                We build and plant to withstand the elements, ensuring
                your outdoor space remains beautiful year after year.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-900 text-center px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Join the Sahgil Family
          </h2>

          <p className="text-emerald-100 mb-10 max-w-2xl mx-auto text-lg">
            Let us help you write the next chapter of your home's story.
          </p>

          <Button
            asChild
            className="h-14 px-8 text-lg font-bold bg-white text-emerald-900 hover:bg-stone-100 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <Link to="/contact">
              Start Your Project
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}