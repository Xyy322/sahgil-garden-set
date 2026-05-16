import { useEffect, useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ShoppingCart, Calendar, Leaf, Armchair } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useCart } from "../components/CartContext";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
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

  const handleAddToCart = (product: Product) => {
    const user = getAuth().currentUser;

    if (!user) {
      alert("Please log in first to add items to your cart.");
      navigate("/login", { state: { from: "/services" } });
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
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Hero Section */}
      <section className="bg-white border-b border-stone-200 px-4 py-12 md:py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-4 text-4xl md:text-5xl font-bold text-stone-900">
            Our Services
          </h1>
          <p className="mx-auto max-w-2xl text-base text-stone-600 md:text-lg">
            We bring two distinct areas of expertise to transform your outdoor space.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl space-y-16 md:space-y-20 px-4 py-12 md:py-16">
        
        {/* Furniture Section */}
        <section id="furniture">
          <div className="mb-12 flex flex-col items-start gap-4 border-b border-stone-200 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-stone-200 bg-emerald-50">
              <Armchair className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-stone-900">
                Furniture Catalog & Ordering
              </h2>
              <p className="text-stone-600 text-base md:text-lg">
                Browse and order handcrafted furniture pieces designed for beauty, comfort, and durability. Each item is carefully selected to enhance your outdoor living experience.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-96 animate-pulse border-stone-200" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className="p-0 overflow-hidden border-stone-200 hover:shadow-md transition-shadow">
                  <div className="h-64 bg-stone-100">
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-6 flex flex-col gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-stone-900 mb-2">
                        {product.name}
                      </h3>
                      <p className="text-stone-600 text-sm md:text-base line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 mt-auto">
                      <div className="text-lg font-bold text-emerald-600">
                        ₱{product.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="w-full"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <p className="text-stone-600 mb-4">Need a custom build?</p>
            <Button asChild variant="outline">
              <Link to="/contact">
                Request Custom Build
              </Link>
            </Button>
          </div>
        </section>

        {/* Landscaping Section */}
        <section id="landscaping" className="mt-8">
          <div className="mb-10 flex flex-col items-start gap-4 border-b border-stone-200 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-stone-200 bg-emerald-50">
              <Leaf className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-stone-900">
                Landscaping Appointments
              </h2>
              <p className="text-stone-600 text-base md:text-lg">
                Book consultations with our expert landscapers to design your perfect outdoor space.
              </p>
            </div>
          </div>

          <Card className="p-8 md:p-10 border-stone-200 bg-gradient-to-br from-emerald-50/30 to-white">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
              {/* Content Section */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-stone-900 mb-2">
                      Professional Design Consultation
                    </h3>
                    <p className="text-stone-600 md:text-lg leading-relaxed">
                      Meet with our expert landscapers to discuss your vision and transform your outdoor space into the garden of your dreams.
                    </p>
                  </div>

                  {/* Key Details */}
                  <div className="space-y-3 pt-4 border-t border-stone-200">
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900">Flexible Scheduling</p>
                        <p className="text-sm text-stone-600">Choose a time that works best for you</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Leaf className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900">Expert Guidance</p>
                        <p className="text-sm text-stone-600">Professional advice tailored to your space</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button asChild className="h-12 px-6 text-base mt-8 md:mt-0 md:w-auto">
                  <Link to="/landscaping/booking">
                    <Calendar className="h-5 w-5 mr-2" />
                    Schedule Now
                  </Link>
                </Button>
              </div>

              {/* Visual Divider and Summary */}
              <div className="md:border-l border-stone-200 md:pl-12 flex flex-col justify-center">
                <div className="space-y-4">
                  <div className="text-center md:text-left">
                    <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Next Steps</p>
                    <h4 className="text-xl font-bold text-stone-900 mt-1">
                      Start Your Transformation
                    </h4>
                  </div>
                  <p className="text-stone-600 text-sm md:text-base leading-relaxed">
                    Our landscape design process is collaborative and transparent. We listen to your ideas, understand your space, and create a plan that brings your vision to life.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}