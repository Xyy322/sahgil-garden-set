import { useEffect, useMemo, useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  ShoppingCart,
  Calendar,
  Check,
  Leaf,
  Armchair,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { collection, onSnapshot, query } from "firebase/firestore";

import { useCart } from "../components/CartContext";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { db } from "../../utils/firebase/config";
import { useAuth } from "../context/AuthContext";

import type { Product } from "../../types/product";

type CatalogProduct = Product & {
  status?: string;
  category?: string;
  imageUrl?: string;
  createdAt?: unknown;
};

function normalizeProduct(id: string, data: any): CatalogProduct {
  return {
    id,
    name: typeof data.name === "string" ? data.name : "Untitled Product",
    description: typeof data.description === "string" ? data.description : "",
    price: typeof data.price === "number" ? data.price : Number(data.price) || 0,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
    category: typeof data.category === "string" ? data.category : "",
    customizable: data.customizable === true,
    status: typeof data.status === "string" ? data.status : "available",
  } as CatalogProduct;
}

function formatMoney(value: unknown): string {
  const amount = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return "₱0.00";
  }

  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function Services() {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [loginPrompt, setLoginPrompt] = useState(false);

  useEffect(() => {
    setLoading(true);
    setProductsError("");

    // Do not use where + orderBy here to avoid Firestore index issues.
    // We filter available products safely on the client side.
    const q = query(collection(db, "products"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const mapped = snapshot.docs
            .map((document) => normalizeProduct(document.id, document.data()))
            .filter((product) => product.status === "available")
            .sort((a, b) => a.name.localeCompare(b.name));

          setProducts(mapped);
          setProductsError("");
        } catch (error) {
          console.error("Product parsing error:", error);
          setProducts([]);
          setProductsError("Some product records contain invalid data.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Products listener error:", error);
        setProducts([]);
        setProductsError(error.message || "Failed to load products.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const availableProducts = useMemo(() => {
    return products.filter((product) => product.status === "available");
  }, [products]);

  const handleAddToCart = (product: CatalogProduct) => {
    if (authLoading) {
      return;
    }

    if (!user || role !== "customer") {
      setLoginPrompt(true);
      return;
    }

    if (product.status !== "available") {
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      image: product.imageUrl || "",
      quantity: 1,
    });
  };

  return (
    <div className="bg-[#f9f7f4] min-h-screen">
      {loginPrompt && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-4 animate-fade-in">
          <span className="text-sm font-medium">
            Please log in as a customer to add items to your cart.
          </span>

          <button
            onClick={() => {
              setLoginPrompt(false);
              navigate("/login", { state: { from: "/services" } });
            }}
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
      <section className="relative w-full h-[65vh] min-h-[500px] bg-stone-900 flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-stone-900 to-emerald-900/30" />

        <div className="relative z-10 text-white px-4 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Our Services
          </h1>
          <p className="text-lg md:text-xl text-stone-300">
            Furniture ordering and landscaping appointments in one convenient
            system.
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
                Browse available handcrafted garden sets and place an order
                online.
              </p>
            </div>
          </div>

          {productsError && (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              {productsError}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, index) => (
                <Card
                  key={index}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 animate-pulse h-96"
                >
                  <div className="h-64 bg-stone-200" />

                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-stone-200 rounded w-3/4" />
                    <div className="h-4 bg-stone-200 rounded w-full" />
                    <div className="h-10 bg-stone-200 rounded-xl w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : availableProducts.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-stone-500">
              No available products at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableProducts.map((product) => (
                <Card
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 flex flex-col group hover:shadow-xl transition-shadow p-0"
                >
                  <div className="h-64 overflow-hidden relative bg-stone-100">
                    <ImageWithFallback
                      src={product.imageUrl || ""}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full font-bold text-stone-800 shadow-sm">
                      {formatMoney(product.price)}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-stone-800">
                        {product.name}
                      </h3>

                      {product.customizable && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Customizable
                        </span>
                      )}
                    </div>

                    {product.category && (
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2">
                        {product.category}
                      </p>
                    )}

                    <p className="text-stone-600 mb-6 flex-grow line-clamp-3">
                      {product.description || "No description provided."}
                    </p>

                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={authLoading}
                      className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
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
              <Link to="/contact">Request a Custom Build</Link>
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
                Schedule a consultation with the team for landscaping services.
              </p>
            </div>
          </div>

          <Card className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 flex flex-col lg:flex-row p-0">
            <div className="lg:w-1/2 h-80 lg:h-auto relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1663185777721-a53e090dfecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMHBhdGh8ZW58MXx8fHwxNzcyNzMxNjMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Landscaping work"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:w-1/2 p-8 md:p-10 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-stone-800 mb-4">
                Garden and Landscape Consultation
              </h3>

              <p className="text-stone-600 mb-6 leading-relaxed">
                Book an appointment so the business can organize schedules,
                avoid conflicts, and prepare for your requested landscaping
                consultation.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-stone-700">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Online appointment scheduling
                </li>

                <li className="flex items-center gap-3 text-stone-700">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Schedule conflict prevention
                </li>

                <li className="flex items-center gap-3 text-stone-700">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Appointment status tracking
                </li>
              </ul>

              <Button
                asChild
                className="w-full sm:w-fit bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-3"
              >
                <Link to="/landscaping/booking">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Appointment
                </Link>
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}