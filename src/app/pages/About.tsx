// Import navigation, image, and icon components for use in the About page.
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { TreePine, Sprout, Home, Ruler, Droplets } from "lucide-react";

// The About page provides the company story, values, and philosophy.
// It helps users understand the brand, its origins, and what makes it unique.
// This page is informational and does not directly affect application state, but it builds trust and context for users.
export function About() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Hero Section */}
      <section className="relative w-full h-[340px] md:h-[440px] bg-white border-b border-stone-200 overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1759008348522-2330a9cc4d96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b20lMjBsYW5kc2NhcGUlMjBkZXNpZ258ZW58MXx8fHwxNzcyNzMxNDI5fDA&ixlib=rb-4.1.0&q=80&w=1920" 
            alt="Beautiful garden path" 
            className="w-full h-full object-cover opacity-50 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-stone-50/20 to-transparent"></div>
        </div>
        <div className="relative z-10 h-full max-w-4xl mx-auto px-4 flex flex-col justify-center items-center text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-stone-900 mb-4 md:mb-6 tracking-tight">Our Story</h1>
          <p className="text-lg md:text-xl text-stone-600 max-w-2xl font-light leading-relaxed">From a small carpentry workshop to a full-service outdoor living studio. We build spaces that bring people together.</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 max-w-4xl mx-auto px-4">
        {/* Story Section */}
        <div className="mb-16 md:mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 lg:order-1 relative rounded-2xl md:rounded-3xl overflow-hidden shadow-md">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1663185777721-a53e090dfecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMHBhdGh8ZW58MXx8fHwxNzcyNzMxNjMxfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Craftsman working"
                className="w-full h-full object-cover aspect-square"
              />
            </div>
            <div className="order-1 lg:order-2 space-y-5">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4 md:mb-6">Rooted in Craftsmanship</h2>
                <p className="text-base md:text-lg text-stone-600 leading-relaxed">Founded in 2020 by Mr. Gilbert Rosales, Sahgil Garden Set began with a simple mission: to build outdoor furniture that actually lasts. After years of seeing clients struggle to find landscaping services that matched the quality of our furniture, we decided to expand.</p>
              </div>
              <p className="text-base md:text-lg text-stone-600 leading-relaxed">Today, we offer a seamless integration of bespoke furniture design and expert landscape architecture. We believe your garden should be a natural extension of your home, a place of rest, entertainment, and beauty.</p>
              <div className="pt-4 border-t border-stone-200">
                <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Our Approach</p>
                <p className="text-base text-stone-700 mt-2">Quality, precision, and vision in every project we undertake.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="border-t border-stone-200 pt-16 md:pt-20">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-3">Our Core Values</h2>
            <p className="text-base md:text-lg text-stone-600 max-w-2xl mx-auto">The principles that guide every cut, planting, and consultation we provide.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 md:p-8 text-center flex flex-col items-center border-stone-200 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                <TreePine className="w-7 h-7 md:w-8 md:h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-stone-900 mb-3">Sustainability</h3>
              <p className="text-stone-600 text-sm md:text-base leading-relaxed">We ensure that the quality of our materials and build meet the highest standards, creating furniture and landscapes that endure.</p>
            </Card>

            <Card className="p-6 md:p-8 text-center flex flex-col items-center border-stone-200 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                <Ruler className="w-7 h-7 md:w-8 md:h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-stone-900 mb-3">Precision</h3>
              <p className="text-stone-600 text-sm md:text-base leading-relaxed">Measure twice, cut once. Our meticulous attention to detail ensures longevity in both furniture and hardscaping.</p>
            </Card>

            <Card className="p-6 md:p-8 text-center flex flex-col items-center border-stone-200 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                <Home className="w-7 h-7 md:w-8 md:h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-stone-900 mb-3">Livability</h3>
              <p className="text-stone-600 text-sm md:text-base leading-relaxed">Gardens are meant to be used, not just admired. We design for comfort and real-world utility in every space.</p>
            </Card>

            <Card className="p-6 md:p-8 text-center flex flex-col items-center border-stone-200 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                <Droplets className="w-7 h-7 md:w-8 md:h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-stone-900 mb-3">Durability</h3>
              <p className="text-stone-600 text-sm md:text-base leading-relaxed">We build and plant to withstand the elements, ensuring your outdoor space remains beautiful year after year.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 bg-white border-t border-stone-200 text-center px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-stone-900 mb-4 md:mb-6">Join the Sahgil Family</h2>
          <p className="text-stone-600 mb-8 md:mb-10 max-w-2xl mx-auto text-base md:text-lg">Let us help you write the next chapter of your home's story.</p>
          <Button asChild className="h-12 px-8 text-base">
            <Link to="/contact">
              Start Your Project
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
