import { useEffect, useMemo, useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  ShoppingCart,
  Calendar,
  Check,
  Leaf,
  Armchair,
  Search,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { collection, onSnapshot, query } from "firebase/firestore";

import { useCart } from "../components/CartContext";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
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
    category: typeof data.category === "string" ? data.category : "Garden Set",
    customizable: data.customizable === true,
    status:
      typeof data.status === "string"
        ? data.status.trim().toLowerCase()
        : "available",
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

  const [searchTerm, setSearchTerm] = useState("");
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [initialVisibleCount, setInitialVisibleCount] = useState(6);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(
    null
  );

  useEffect(() => {
    const updateVisibleCount = () => {
      setInitialVisibleCount(window.innerWidth < 640 ? 4 : 6);
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);

    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  useEffect(() => {
    setLoading(true);
    setProductsError("");

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

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      return (
        !keyword ||
        product.name.toLowerCase().includes(keyword) ||
        product.description.toLowerCase().includes(keyword) ||
        product.category?.toLowerCase().includes(keyword)
      );
    });
  }, [products, searchTerm]);

  const visibleProducts = useMemo(() => {
    if (showAllProducts) {
      return filteredProducts;
    }

    return filteredProducts.slice(0, initialVisibleCount);
  }, [filteredProducts, showAllProducts, initialVisibleCount]);

  const hasMoreProducts = filteredProducts.length > initialVisibleCount;

  const handleAddToCart = (product: CatalogProduct) => {
    if (authLoading) return;

    if (!user || role !== "customer") {
      setLoginPrompt(true);
      return;
    }

    if (product.status !== "available") return;

    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      image: product.imageUrl || "",
      quantity: 1,
    });
  };

  return (
    <div className="min-h-screen bg-[#f9f7f4]">
      {loginPrompt && (
        <div className="fixed left-4 right-4 top-24 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl bg-stone-900 px-5 py-4 text-white shadow-xl sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium">
            Please log in as a customer to add items to your cart.
          </span>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setLoginPrompt(false);
                navigate("/login", { state: { from: "/services" } });
              }}
              className="text-sm font-bold text-emerald-400 hover:text-emerald-300"
            >
              Log in
            </button>

            <button
              onClick={() => setLoginPrompt(false)}
              className="text-sm text-stone-400 hover:text-white"
              aria-label="Close login prompt"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <section className="relative flex min-h-[390px] w-full items-center justify-center overflow-hidden bg-stone-900 px-4 py-20 text-center md:min-h-[500px]">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-stone-900 to-emerald-900/30" />

        <div className="relative z-10 mx-auto max-w-3xl text-white">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
            Products and Services
          </p>

          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            Our Services
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-stone-300 md:text-xl">
            Browse available garden furniture sets and schedule landscaping
            appointments in one convenient system.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#furniture"
              className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Browse Products
            </a>

            <a
              href="#landscaping"
              className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Book Landscaping
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <section id="furniture" className="scroll-mt-28">
          <div className="mb-8 flex flex-col gap-4 border-b border-stone-200 pb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
                <Armchair className="h-8 w-8 text-emerald-600" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-stone-900 md:text-3xl">
                  Product Catalog
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 md:text-base">
                  Browse available garden furniture sets and place your order
                  online.
                </p>
              </div>
            </div>

            <p className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {products.length} available product
              {products.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search garden sets..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowAllProducts(false);
                  }}
                  className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <p className="text-sm text-stone-500">
                Showing{" "}
                <span className="font-semibold text-stone-800">
                  {visibleProducts.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-stone-800">
                  {filteredProducts.length}
                </span>{" "}
                products
              </p>
            </div>
          </div>

          {productsError && (
            <div className="mb-8 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm">{productsError}</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <Card
                  key={index}
                  className="h-[390px] animate-pulse overflow-hidden rounded-2xl border border-stone-100 bg-white p-0 shadow-sm"
                >
                  <div className="h-52 bg-stone-200" />

                  <div className="space-y-3 p-5">
                    <div className="h-6 w-3/4 rounded bg-stone-200" />
                    <div className="h-4 w-1/2 rounded bg-stone-200" />
                    <div className="h-4 w-full rounded bg-stone-200" />
                    <div className="h-11 w-full rounded-xl bg-stone-200" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
              <Armchair className="mx-auto mb-4 h-12 w-12 text-stone-300" />
              <h3 className="text-lg font-semibold text-stone-800">
                No products found
              </h3>
              <p className="mt-2 text-sm text-stone-500">
                Try changing your search keyword.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="group flex overflow-hidden rounded-2xl border border-stone-100 bg-white p-0 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="flex w-full flex-col">
                      <div className="relative h-52 overflow-hidden bg-stone-100 sm:h-56">
                        <ImageWithFallback
                          src={product.imageUrl || ""}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        <div className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-stone-900 shadow-sm backdrop-blur">
                          {formatMoney(product.price)}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="mb-3">
                          <h3 className="text-lg font-bold text-stone-900 md:text-xl">
                            {product.name}
                          </h3>

                          {product.customizable && (
                            <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Customizable
                            </span>
                          )}
                        </div>

                        <p className="mb-5 line-clamp-2 flex-1 text-sm leading-relaxed text-stone-600">
                          {product.description || "No description provided."}
                        </p>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSelectedProduct(product)}
                            className="h-11 rounded-xl"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Details
                          </Button>

                          <Button
                            onClick={() => handleAddToCart(product)}
                            disabled={authLoading}
                            className="h-11 rounded-xl bg-stone-900 font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {hasMoreProducts && (
                <div className="mt-8 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAllProducts((prev) => !prev)}
                    className="w-full rounded-xl sm:w-auto"
                  >
                    {showAllProducts
                      ? "Show Less Products"
                      : `Show More Products (${filteredProducts.length - initialVisibleCount} more)`}
                  </Button>
                </div>
              )}
            </>
          )}

          <div className="mt-10 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center shadow-sm">
            <h3 className="text-lg font-bold text-stone-900">
              Need a custom build or per-piece request?
            </h3>

            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
              Custom furniture, per-piece requests, and special dimensions are
              handled case by case. Send an inquiry so the team can review your
              request.
            </p>

            <Button
              type="button"
              onClick={() => navigate("/contact")}
              className="mt-5 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
            >
              Request Custom Build
            </Button>
          </div>
        </section>

        <section id="landscaping" className="scroll-mt-28">
          <div className="mb-8 flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
              <Leaf className="h-8 w-8 text-emerald-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-stone-900 md:text-3xl">
                Landscaping Appointments
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 md:text-base">
                Schedule a consultation with the team for landscaping services.
              </p>
            </div>
          </div>

          <Card className="overflow-hidden rounded-3xl border border-stone-100 bg-white p-0 shadow-sm">
            <div className="flex flex-col lg:flex-row">
              <div className="relative h-72 lg:h-auto lg:w-1/2">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1663185777721-a53e090dfecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMHBhdGh8ZW58MXx8fHwxNzcyNzMxNjMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Landscaping work"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:w-1/2">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Appointment Scheduling
                </p>

                <h3 className="text-2xl font-bold text-stone-900">
                  Garden and Landscape Consultation
                </h3>

                <p className="mt-4 leading-relaxed text-stone-600">
                  Book an appointment so the business can organize schedules,
                  avoid conflicts, and prepare for your requested landscaping
                  consultation.
                </p>

                <ul className="my-7 space-y-3">
                  <li className="flex items-start gap-3 text-sm text-stone-700">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    Online appointment scheduling
                  </li>

                  <li className="flex items-start gap-3 text-sm text-stone-700">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    Three-day schedule conflict prevention
                  </li>

                  <li className="flex items-start gap-3 text-sm text-stone-700">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    Appointment status tracking
                  </li>
                </ul>

                <Button
                  type="button"
                  onClick={() => navigate("/landscaping/booking")}
                  className="h-12 w-full rounded-xl bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700 sm:w-fit"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Book Appointment
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>

      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
                <DialogDescription>
                  Product details and ordering information.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="overflow-hidden rounded-2xl bg-stone-100">
                  <ImageWithFallback
                    src={selectedProduct.imageUrl || ""}
                    alt={selectedProduct.name}
                    className="h-72 w-full object-cover"
                  />
                </div>

                <div className="flex flex-col">
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatMoney(selectedProduct.price)}
                  </p>

                  {selectedProduct.customizable && (
                    <span className="mt-3 w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Customizable
                    </span>
                  )}

                  <p className="mt-5 text-sm leading-relaxed text-stone-600">
                    {selectedProduct.description || "No description provided."}
                  </p>

                  <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-sm font-semibold text-stone-800">
                      Custom request?
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      For per-piece orders or custom dimensions, send an inquiry
                      through the Contact page.
                    </p>
                  </div>

                  <div className="mt-auto grid gap-3 pt-6 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedProduct(null);
                        navigate("/contact");
                      }}
                      className="rounded-xl"
                    >
                      Custom Inquiry
                    </Button>

                    <Button
                      type="button"
                      onClick={() => handleAddToCart(selectedProduct)}
                      disabled={authLoading}
                      className="rounded-xl bg-stone-900 text-white hover:bg-stone-800"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}