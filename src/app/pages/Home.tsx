// Import navigation, icons, and image component
import { Link } from "react-router";
import { ArrowRight, CheckCircle, Leaf, Palette, Armchair, ShieldCheck, Clock, Award, Star, Quote } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

// Home page component for the landing page
export function Home() {
  return (
    <div className="flex flex-col w-full">

      {/* HERO (LARGE - ONLY ONE IN SYSTEM) */}
      <section className="relative w-full h-[85vh] min-h-[700px] bg-stone-900 overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1766852092602-3d5791b1e028"
            alt="Garden furniture"
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />
        </div>
        
        {/* Hero content: Title, subtitle, and action buttons */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center pt-20">
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-emerald-300 uppercase bg-emerald-900/50 rounded-full border border-emerald-500/30 backdrop-blur-sm">
            Premium Outdoor Living
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white max-w-4xl tracking-tight leading-tight mb-6 text-balance">
            Transform Your Garden into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Dream Space</span>
          </h1>
          <p className="text-xl md:text-2xl text-stone-200 max-w-2xl mb-10 font-light leading-relaxed">
            Quality furniture and expert landscaping services designed for every home. Elevate your outdoor lifestyle today.
          </p>
          {/* Action buttons for booking landscaping or ordering furniture */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link to="/services" className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-emerald-600 rounded-full hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 group">
              Book Landscaping
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/services" className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all hover:-translate-y-0.5">
              Order Furniture
            </Link>
          </div>
        </div>
      </section>

      {/* Features / About Section: Highlights the three main offerings with images, icons, and descriptions. Each feature is a card with a call-to-action link. */}
      <section className="py-24 bg-[#f9f7f4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header with title and subtitle */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-4 tracking-tight">Everything You Need for the Perfect Garden</h2>
            <p className="text-lg text-stone-600">Discover our comprehensive range of products and services tailored to bring your outdoor vision to life.</p>
          </div>

          {/* Feature cards grid: Each card represents a core service or product */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Garden Furniture */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-stone-100 flex flex-col h-full">
              {/* Image and icon for furniture */}
              <div className="h-64 overflow-hidden relative">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1766852092602-3d5791b1e028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dGlmdWwlMjBnYXJkZW4lMjBmdXJuaXR1cmV8ZW58MXx8fHwxNzcyNzMxNDI5fDA&ixlib=rb-4.1.0&q=80&w=800&utm_source=figma&utm_medium=referral" 
                  alt="Garden Furniture" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Floating icon badge for visual emphasis */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-sm">
                  <Armchair className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              {/* Card content: Title, description, and link */}
              <div className="p-8 flex-grow flex flex-col">
                <h3 className="text-2xl font-bold text-stone-800 mb-3">Garden Furniture</h3>
                <p className="text-stone-600 leading-relaxed mb-6 flex-grow">
                  Durable, stylish, and comfortable seating arrangements designed to withstand the elements while looking beautiful.
                </p>
                {/* Link to shop furniture services */}
                <Link to="/services" className="inline-flex items-center text-emerald-600 font-semibold hover:text-emerald-700 group/link">
                  Shop Furniture
                  <ArrowRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Feature 2: Landscaping Services */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-stone-100 flex flex-col h-full">
              {/* Image and icon for landscaping */}
              <div className="h-64 overflow-hidden relative">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1770234848941-8bd67b57d700?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW5kc2NhcGluZyUyMGdhcmRlbnxlbnwxfHx8fDE3NzI3MzE0Mjl8MA&ixlib=rb-4.1.0&q=80&w=800&utm_source=figma&utm_medium=referral" 
                  alt="Landscaping Services" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Floating icon badge for visual emphasis */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-sm">
                  <Leaf className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              {/* Card content: Title, description, and link */}
              <div className="p-8 flex-grow flex flex-col">
                <h3 className="text-2xl font-bold text-stone-800 mb-3">Expert Landscaping</h3>
                <p className="text-stone-600 leading-relaxed mb-6 flex-grow">
                  Professional planting, lawn care, and hardscaping services to create a lush, thriving environment right at your doorstep.
                </p>
                {/* Link to book landscaping consultation */}
                <Link to="/services" className="inline-flex items-center text-emerald-600 font-semibold hover:text-emerald-700 group/link">
                  Book Consultation
                  <ArrowRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Feature 3: Custom Designs */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-stone-100 flex flex-col h-full">
              {/* Image and icon for custom design */}
              <div className="h-64 overflow-hidden relative">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1759008348522-2330a9cc4d96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b20lMjBsYW5kc2NhcGUlMjBkZXNpZ258ZW58MXx8fHwxNzcyNzMxNDI5fDA&ixlib=rb-4.1.0&q=80&w=800&utm_source=figma&utm_medium=referral" 
                  alt="Custom Landscape Design" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Floating icon badge for visual emphasis */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-sm">
                  <Palette className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              {/* Card content: Title, description, and link */}
              <div className="p-8 flex-grow flex flex-col">
                <h3 className="text-2xl font-bold text-stone-800 mb-3">Custom Designs</h3>
                <p className="text-stone-600 leading-relaxed mb-6 flex-grow">
                  Bespoke garden layouts tailored to your unique preferences, maximizing space utility and aesthetic appeal.
                </p>
                {/* Link to see portfolio of custom designs */}
                <Link to="/services" className="inline-flex items-center text-emerald-600 font-semibold hover:text-emerald-700 group/link">
                  See Portfolio
                  <ArrowRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Benefits Section: Explains why customers should choose this business, with visual icons and a floating review badge. */}
      <section className="py-24 bg-white border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left column: Textual benefits and value propositions */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-6 tracking-tight">Why Choose Sahgil Garden Set?</h2>
              <p className="text-lg text-stone-600 mb-10 leading-relaxed">
                We blend premium materials with expert craftsmanship to deliver outdoor solutions that stand the test of time. Your satisfaction is our foundation.
              </p>
              {/* List of customer benefits, each with an icon and description */}
              <div className="space-y-8">
                {/* Benefit 1: Reliability */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-stone-800 mb-2">Unmatched Reliability</h4>
                    <p className="text-stone-600 leading-relaxed">We show up on time, communicate clearly, and deliver exactly what we promise, every single time.</p>
                  </div>
                </div>
                {/* Benefit 2: Quality Materials */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-stone-800 mb-2">Quality Materials</h4>
                    <p className="text-stone-600 leading-relaxed">From weather-resistant teak wood to locally sourced stone, we only use the finest materials available.</p>
                  </div>
                </div>
                {/* Benefit 3: Fast Service */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-stone-800 mb-2">Fast, Efficient Service</h4>
                    <p className="text-stone-600 leading-relaxed">Our experienced team completes installations quickly without ever compromising on attention to detail.</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Right column: Image of a landscaped garden with a floating review badge */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1770234848941-8bd67b57d700?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW5kc2NhcGluZyUyMGdhcmRlbnxlbnwxfHx8fDE3NzI3MzE0Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Beautiful landscaped garden patio"
                className="w-full h-full object-cover aspect-square lg:aspect-[4/5]"
              />
              {/* Subtle border ring for visual depth */}
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-3xl"></div>
              {/* Floating badge with review score and count, animated in from the left */}
              <div className="absolute bottom-8 left-4 lg:-left-12 bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 max-w-xs animate-in slide-in-from-left duration-1000">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-stone-800">4.9/5</div>
                  <div className="text-sm text-stone-500 font-medium">Average Rating from 500+ Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section: Displays customer reviews with avatars, names, and quotes. Includes a decorative SVG background pattern. */}
      <section className="py-24 bg-emerald-900 text-white relative overflow-hidden">
        {/* Background decorative pattern using SVG for subtle branding */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="leaf-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M30 0C30 16.5685 16.5685 30 0 30C16.5685 30 30 43.4315 30 60C30 43.4315 43.4315 30 60 30C43.4315 30 30 16.5685 30 0Z" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#leaf-pattern)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section header with title and subtitle */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Loved by Homeowners</h2>
            <p className="text-lg text-emerald-100/80">Don't just take our word for it. Here's what our happy customers have to say about their new spaces.</p>
          </div>

          {/* Grid of testimonial cards, each with a quote, avatar, and customer info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1: Sarah Jenkins */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <Quote className="w-10 h-10 text-emerald-400 mb-6 opacity-50" />
              <p className="text-lg text-emerald-50 mb-8 leading-relaxed font-light">
                "Sahgil Garden completely transformed our backyard. The new furniture set is gorgeous and the landscaping team was professional and incredibly efficient."
              </p>
              <div className="flex items-center gap-4">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1772371272208-412168748f2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWlsaW5nJTIwcGVyc29uJTIwYXZhdGFyfGVufDF8fHx8MTc3MjY0OTA2Nnww&ixlib=rb-4.1.0&q=80&w=200&utm_source=figma&utm_medium=referral" 
                  alt="Sarah Jenkins" 
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-400/50"
                />
                <div>
                  <h4 className="font-semibold text-white">Sarah Jenkins</h4>
                  <p className="text-sm text-emerald-300">Homeowner</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2: Michael Chen */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <Quote className="w-10 h-10 text-emerald-400 mb-6 opacity-50" />
              <p className="text-lg text-emerald-50 mb-8 leading-relaxed font-light">
                "The quality of the teak dining set is unmatched. It's weathered perfectly over the last year. I highly recommend their custom design consultation!"
              </p>
              <div className="flex items-center gap-4">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1615843423179-bea071facf96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGF2YXRhcnxlbnwxfHx8fDE3NzI3MTYwOTh8MA&ixlib=rb-4.1.0&q=80&w=200&utm_source=figma&utm_medium=referral" 
                  alt="Michael Chen" 
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-400/50"
                />
                <div>
                  <h4 className="font-semibold text-white">Michael Chen</h4>
                  <p className="text-sm text-emerald-300">Property Developer</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3: Elena Lawson (uses initials avatar) */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 md:hidden lg:block">
              <Quote className="w-10 h-10 text-emerald-400 mb-6 opacity-50" />
              <p className="text-lg text-emerald-50 mb-8 leading-relaxed font-light">
                "From our first meeting to the final installation, the team was fantastic. Our new garden oasis has become our family's favorite place to spend the weekends."
              </p>
              <div className="flex items-center gap-4">
                {/* Initials avatar for anonymous/local customer */}
                <div className="w-12 h-12 rounded-full bg-emerald-700 flex items-center justify-center ring-2 ring-emerald-400/50">
                  <span className="text-xl font-bold text-white">EL</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Elena Lawson</h4>
                  <p className="text-sm text-emerald-300">Local Resident</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section: Final call-to-action encouraging users to book a service or order furniture. Includes a summary, button, and quick benefits. */}
      <section className="py-24 bg-stone-100 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Section title and description */}
          <h2 className="text-4xl md:text-5xl font-bold text-stone-800 mb-6 tracking-tight">Ready to Create Your Perfect Oasis?</h2>
          <p className="text-xl text-stone-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Our experts are ready to help you choose the right furniture or design a complete landscape overhaul. Let's build something beautiful together.
          </p>
          {/* Main CTA button to go to services page */}
          <Link to="/services" className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-emerald-600 rounded-full hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 hover:shadow-2xl hover:shadow-emerald-500/40 hover:-translate-y-1 group">
            Book Service or Order Now
            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
          </Link>
          {/* Quick benefits below the button */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-stone-500 font-medium">
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> No commitment required</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Free quote within 24h</span>
          </div>
        </div>
      </section>
    </div>
  );
}
