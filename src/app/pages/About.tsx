// Import navigation, image, and icon components for use in the About page.
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { TreePine, Sprout, Home, Ruler, Droplets } from "lucide-react";

// The About page provides the company story, values, and philosophy.
// It helps users understand the brand, its origins, and what makes it unique.
// This page is informational and does not directly affect application state, but it builds trust and context for users.
export function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative w-full h-[340px] md:h-[440px] bg-card border-b border-border overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1759008348522-2330a9cc4d96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b20lMjBsYW5kc2NhcGUlMjBkZXNpZ258ZW58MXx8fHwxNzcyNzMxNDI5fDA&ixlib=rb-4.1.0&q=80&w=1920" 
            alt="Beautiful garden path" 
            className="w-full h-full object-cover opacity-50 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
        </div>
        <div className="relative z-10 h-full max-w-5xl mx-auto px-4 flex flex-col justify-center items-center text-center pt-8">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 md:mb-6 tracking-tight">Our Story</h1>
          <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl font-light leading-relaxed">From a small carpentry workshop to a full-service outdoor living studio. We build spaces that bring people together.</p>
        </div>
      </section>
      {/* Main Content */}
      <section className="py-14 md:py-20 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center mb-16 md:mb-24">
          <div className="order-2 lg:order-1 relative rounded-2xl md:rounded-3xl overflow-hidden shadow-xl">
            <ImageWithFallback 
              src="https://images.unsplash.com/photo-1663185777721-a53e090dfecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMHBhdGh8ZW58MXx8fHwxNzcyNzMxNjMxfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Craftsman working"
              className="w-full h-full object-cover aspect-square"
            />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 md:mb-6">Rooted in Craftsmanship</h2>
            <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6 leading-relaxed">Founded in 2020 by Mr. Gilbert Rosales, Sahgil Garden Set began with a simple mission: to build outdoor furniture that actually lasts. After years of seeing clients struggle to find landscaping services that matched the quality of our furniture, we decided to expand.</p>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">Today, we offer a seamless integration of bespoke furniture design and expert landscape architecture. We believe your garden should be a natural extension of your home, a place of rest, entertainment, and beauty.</p>
          </div>
        </div>
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 md:mb-4">Our Core Values</h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">The principles that guide every cut, planting, and consultation.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="bg-card p-6 md:p-8 rounded-xl shadow-sm border border-border text-center flex flex-col items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-secondary rounded-full flex items-center justify-center mb-4 md:mb-6">
              <TreePine className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-3">Sustainability</h3>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">We make sure that the quality of our materials and build are of high standards and quality.</p>
          </div>
          <div className="bg-card p-6 md:p-8 rounded-xl shadow-sm border border-border text-center flex flex-col items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-secondary rounded-full flex items-center justify-center mb-4 md:mb-6">
              <Ruler className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-3">Precision</h3>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">Measure twice, cut once. Our attention to detail ensures longevity in both furniture and hardscaping.</p>
          </div>
          <div className="bg-card p-6 md:p-8 rounded-xl shadow-sm border border-border text-center flex flex-col items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-secondary rounded-full flex items-center justify-center mb-4 md:mb-6">
              <Home className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-3">Livability</h3>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">Gardens are meant to be used, not just looked at. We design for comfort and real-world utility.</p>
          </div>
          <div className="bg-card p-6 md:p-8 rounded-xl shadow-sm border border-border text-center flex flex-col items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-secondary rounded-full flex items-center justify-center mb-4 md:mb-6">
              <Droplets className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 md:mb-3">Durability</h3>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">We build and plant to withstand the elements, ensuring your space looks beautiful year after year.</p>
          </div>
        </div>
      </section>
      {/* CTA */}
      <section className="py-14 md:py-20 bg-card border-t border-border text-center px-4">
        <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4 md:mb-6">Join the Sahgil Family</h2>
        <p className="text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto text-base md:text-lg">Let us help you write the next chapter of your home's story.</p>
        <Link to="/contact" className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-bold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Start Your Project
        </Link>
      </section>
    </div>
  );
}
