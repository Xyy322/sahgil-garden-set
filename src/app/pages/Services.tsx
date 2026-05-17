import { useEffect, useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  ShoppingCart,
  Calendar,
  Check,
  Leaf,
  Armchair,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../utils/firebase/config";
import { getAuth } from "firebase/auth";

import type { Product } from "../../types/product";

export function Services() {  
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const q = query(
      collection(db, "products"),
      where("status", "==", "available"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const mapped = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Product[];

        setProducts(mapped);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setProducts([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const [loginPrompt, setLoginPrompt] = useState(false);

const handleAddToCart = (product: Product) => {
  const user = getAuth().currentUser;

  if (!user) {
    setLoginPrompt(true);
    return;
  }

  addItem({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.imageUrl,
    quantity: 1,
  });
};

  return (
    <div className="bg-[#f9f7f4] min-h-screen">

      {loginPrompt && (
  <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-4 animate-fade-in">
    <span className="text-sm font-medium">Please log in to add items to your cart.</span>
    <button
      onClick={() => { setLoginPrompt(false); navigate("/login", { state: { from: "/services" } }); }}
      className="text-emerald-400 font-bold text-sm hover:text-emerald-300"
    >
      Log in
    </button>
    <button
      onClick={() => setLoginPrompt(false)}
      className="text-stone-400 hover:text-white text-sm"
    >
      ✕
    </button>
  </div>
)}

      {/* Hero */}
      <section className="relative w-full h-[65vh] min-h-[500px] bg-stone-900 flex items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-stone-900 to-emerald-900/30" />

        <div className="relative z-10 text-white px-4 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Our Services
          </h1>
          <p className="text-lg md:text-xl text-stone-300">
            Furniture + Landscaping in one system.
          </p>
        </div>
      </section>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">

        {/* Furniture Section */}
        <section id="furniture" className="scroll-mt-24">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-12 border-b border-stone-200 pb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Armchair className="w-8 h-8 text-emerald-600" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-stone-800">
                Furniture Catalog & Ordering
              </h2>

              <p className="text-stone-600 mt-2">
                Browse our handcrafted collection and order directly to
                your door.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <Card
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 animate-pulse h-96"
                >
                  <div className="h-64 bg-stone-200"></div>

                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-stone-200 rounded w-3/4"></div>
                    <div className="h-4 bg-stone-200 rounded w-full"></div>
                    <div className="h-10 bg-stone-200 rounded-xl w-full"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 flex flex-col group hover:shadow-xl transition-shadow p-0"
                >
                  {/* Product Image */}
                  <div className="h-64 overflow-hidden relative">
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full font-bold text-stone-800 shadow-sm">
                      ₱
                      {product.price.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  {/* Product Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-stone-800 mb-2">
                      {product.name}
                    </h3>

                    <p className="text-stone-600 mb-6 flex-grow line-clamp-3">
                      {product.description}
                    </p>

                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <p className="text-stone-500 italic mb-4">
              Looking for custom dimensions or specific wood types?
            </p>

            <Button asChild variant="outline">
              <Link to="/contact">
                Request a Custom Build
              </Link>
            </Button>
          </div>
        </section>

        {/* Landscaping Section */}
        <section id="landscaping" className="scroll-mt-24">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-12 border-b border-stone-200 pb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Leaf className="w-8 h-8 text-emerald-600" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-stone-800">
                Landscaping Appointments
              </h2>

              <p className="text-stone-600 mt-2">
                Schedule a consultation with our expert design team for
                your next big project.
              </p>
            </div>
          </div>

          <Card className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 flex flex-col lg:flex-row p-0">
            {/* Left Side */}
            <div className="lg:w-1/2 h-80 lg:h-auto relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1663185777721-a53e090dfecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMHBhdGh8ZW58MXx8fHwxNzcyNzMxNjMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Landscaping work"
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-emerald-900/20"></div>

              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
                <h4 className="font-bold text-stone-800 text-lg mb-2">
                  Our Process
                </h4>

                <ul className="space-y-2 text-stone-600 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Free On-Site Consultation
                  </li>

                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    3D Design Proposal
                  </li>

                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Professional Installation
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Side */}
            <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-stone-800 mb-4">
                Book Your Free Consultation
              </h3>

              <p className="text-stone-600 mb-6">
                Our expert landscaping team is ready to transform your
                garden. Choose your preferred date and time from our
                interactive calendar, and we'll confirm your appointment
                right away.
              </p>

              <div className="bg-emerald-50 p-6 rounded-xl mb-6 border border-emerald-200">
                <h4 className="font-semibold text-stone-800 mb-3">
                  Consultation Includes:
                </h4>

                <ul className="space-y-2 text-stone-700 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Free site assessment
                  </li>

                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Design recommendations
                  </li>

                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Project timeline & pricing
                  </li>

                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Landscaping expertise
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg"
                >
                  <Link to="/landscaping/booking">
                    <Calendar className="w-5 h-5" />
                    Schedule Now
                  </Link>
                </Button>

                <p className="text-xs text-stone-500 text-center">
                  ⏱️ Appointments available Monday-Sunday, 9 AM - 10 PM
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}