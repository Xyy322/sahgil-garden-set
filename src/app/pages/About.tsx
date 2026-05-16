// Import navigation, image, and icon components for use in the About page.
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { TreePine, Sprout, Home, Ruler, Droplets } from "lucide-react";

// The About page provides the company story, values, and philosophy.
// It helps users understand the brand, its origins, and what makes it unique.
// This page is informational and does not directly affect application state, but it builds trust and context for users.
export function About() {
  return (
    <div className="bg-[#f9f7f4] min-h-screen">
      {/* Hero Section: visually introduces the company with a background image and overlay for contrast. */}
      <section className="relative w-full h-[400px] md:h-[500px] bg-stone-900 overflow-hidden">
        {/* The background image sets the mood and theme for the brand. */}
        <div className="absolute inset-0">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1759008348522-2330a9cc4d96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b20lMjBsYW5kc2NhcGUlMjBkZXNpZ258ZW58MXx8fHwxNzcyNzMxNDI5fDA&ixlib=rb-4.1.0&q=80&w=1920" 
            alt="Beautiful garden path" 
            className="w-full h-full object-cover opacity-50 mix-blend-overlay"
          />
          {/* Gradient overlay ensures text is readable on top of the image. */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/20 to-transparent"></div>
        </div>
        
        {/* Hero content: Company story headline and summary. */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center pt-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Our Story
          </h1>
          <p className="text-xl md:text-2xl text-stone-200 max-w-3xl font-light leading-relaxed">
            From a small carpentry workshop to a full-service outdoor living studio. We build spaces that bring people together.
          </p>
        </div>
      </section>

      {/* Main Content: Company history, values, and images. This section builds credibility and emotional connection. */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          {/* Left: Image of craftsman at work, reinforcing the brand's hands-on, artisanal approach. */}
          <div className="order-2 lg:order-1 relative rounded-3xl overflow-hidden shadow-2xl">
             <ImageWithFallback 
                src="https://images.unsplash.com/photo-1663185777721-a53e090dfecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMHBhdGh8ZW58MXx8fHwxNzcyNzMxNjMxfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Craftsman working"
                className="w-full h-full object-cover aspect-square"
              />
          </div>
          {/* Right: Text content about the company's founding and philosophy. */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold text-stone-800 mb-6">Rooted in Craftsmanship</h2>
            <p className="text-lg text-stone-600 mb-6 leading-relaxed">
              {/* This paragraph tells the founding story, which humanizes the brand and builds trust. */}
              Founded in 2020 by Mr. Gilbert Rosales, Sahgil Garden Set began with a simple mission: to build outdoor furniture that actually lasts. After years of seeing clients struggle to find landscaping services that matched the quality of our furniture, we decided to expand.
            </p>
            <p className="text-lg text-stone-600 leading-relaxed">
              {/* This paragraph explains the company's evolution and holistic approach. */}
              Today, we offer a seamless integration of bespoke furniture design and expert landscape architecture. We believe your garden should be a natural extension of your home, a place of rest, entertainment, and beauty.
            </p>
          </div>
        </div>

        {/* Values: This section lists the company's core values, which guide business decisions and customer experience. */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-stone-800 mb-4">Our Core Values</h2>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">The principles that guide every cut, planting, and consultation.</p>
        </div>

        {/* Each value is presented as a card with an icon, title, and description. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Value 1: Sustainability. Affects product sourcing and design philosophy. */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <TreePine className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-3">Sustainability</h3>
            <p className="text-stone-600 text-sm leading-relaxed">We make sure that the quality of our materials and build are of high standards and quality.</p>
          </div>
          {/* Value 2: Precision. Affects quality control and customer satisfaction. */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ruler className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-3">Precision</h3>
            <p className="text-stone-600 text-sm leading-relaxed">Measure twice, cut once. Our attention to detail ensures longevity in both furniture and hardscaping.</p>
          </div>
          {/* Value 3: Livability. */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-3">Livability</h3>
            <p className="text-stone-600 text-sm leading-relaxed">Gardens are meant to be used, not just looked at. We design for comfort and real-world utility.</p>
          </div>
          {/* Value 4: Durability. */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Droplets className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-3">Durability</h3>
            <p className="text-stone-600 text-sm leading-relaxed">We build and plant to withstand the elements, ensuring your space looks beautiful year after year.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-900 text-center px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Join the Sahgil Family</h2>
        <p className="text-emerald-100 mb-10 max-w-2xl mx-auto text-lg">Let us help you write the next chapter of your home's story.</p>
        <Link to="/contact" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-emerald-900 bg-white rounded-full hover:bg-stone-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
          Start Your Project
        </Link>
      </section>
    </div>
  );
}
