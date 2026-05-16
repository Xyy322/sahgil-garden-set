// Import image, icons, navigation, and cart context for use in the Services page.
import { useEffect, useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ShoppingCart, Calendar, Check, Leaf, Armchair } from "lucide-react";
import { Link } from "react-router";
import { useCart } from "../components/CartContext";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../../utils/firebase/config";

import type { Product } from "../../types/product";

// The Services page allows users to browse and order furniture, and book landscaping services.
// It directly affects the system by allowing users to add items to their cart (affecting global cart state)
// and by providing entry points to booking and purchasing workflows.
export function Services() {
  // Access addItem function from cart context. This allows this page to update the global cart state.
  const { addItem } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    async function fetchProducts() {
      try {
        // Try to use the query with orderBy createdAt
        const q = query(
          collection(db, "products"),
          where("status", "==", "available"),
          orderBy("createdAt", "desc")
        );
        unsub = onSnapshot(q, (snap) => {
          const mapped = snap.docs.map((d) => ({
            id: d.id,
            ...d.data()
          })) as Product[];
          setProducts(mapped);
          setLoading(false);
        }, (error) => {
          // If Firestore query fails (e.g., missing createdAt), fallback to no orderBy
          console.error("Firestore query error (createdAt):", error);
          // Fallback: fetch without orderBy
          const fallbackQ = query(
            collection(db, "products"),
            where("status", "==", "available")
          );
          unsub = onSnapshot(fallbackQ, (snap2) => {
            const mapped2 = snap2.docs.map((d) => ({
              id: d.id,
              ...d.data()
            })) as Product[];
            setProducts(mapped2);
            setLoading(false);
          });
        });
      } catch (err) {
        console.error("Error loading products:", err);
        setLoading(false);
      }
    }
    fetchProducts();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Handler to add a product to the cart. This function is called when a user clicks "Add to Cart".
  // It updates the global cart state, which is used throughout the app (e.g., in the cart, checkout, etc.).
  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.imageUrl,
      quantity: 1
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <div className="bg-[#1B4332] px-4 py-16 text-center md:px-6 md:py-20">
        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">Our Services</h1>
        <p className="mx-auto max-w-2xl text-base text-[#DAD7CD] md:text-xl">
          We bring two distinct areas of expertise to transform your outdoor space: premium handcrafted furniture and professional landscaping.
        </p>
      </div>

      <div className="mx-auto max-w-[1280px] space-y-20 px-4 py-14 md:px-6 md:py-16">
        <section id="furniture" className="scroll-mt-24">
          <div className="mb-10 flex flex-col items-center gap-4 border-b border-[#DAD7CD] pb-6 md:flex-row">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-[#DAD7CD] bg-white">
              <Armchair className="h-8 w-8 text-[#1B4332]" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#2B2B2B]">Furniture Catalog & Ordering</h2>
              <p className="mt-2 text-[#6B6B6B]">
                Browse our handcrafted collection and order directly to your door.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-96 animate-pulse overflow-hidden p-0">
                  <div className="h-64 bg-[#DAD7CD]" />
                  <div className="space-y-3 p-6">
                    <div className="h-6 w-3/4 rounded bg-[#DAD7CD]" />
                    <div className="h-4 w-full rounded bg-[#DAD7CD]" />
                    <div className="h-11 w-full rounded-xl bg-[#DAD7CD]" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className="group overflow-hidden p-0">
                  <div className="relative h-64 overflow-hidden">
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                    <div className="absolute right-4 top-4 rounded-full border border-[#DAD7CD] bg-white/95 px-3 py-1 font-semibold text-[#2B2B2B] shadow-sm">
                      ₱{product.price}
                    </div>
                  </div>
                  <div className="flex flex-grow flex-col p-6">
                    <h3 className="mb-2 text-xl font-semibold text-[#2B2B2B]">{product.name}</h3>
                    <p className="mb-6 flex-grow text-[#6B6B6B]">{product.description}</p>
                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="w-full"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Add to Cart
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <p className="mb-3 italic text-[#6B6B6B]">Looking for custom dimensions or specific wood types?</p>
            <Link to="/contact" className="font-semibold text-[#1B4332] hover:text-[#2D6A4F]">
              Request a Custom Build
            </Link>
          </div>
        </section>

        <section id="landscaping" className="scroll-mt-24">
          <div className="mb-10 flex flex-col items-center gap-4 border-b border-[#DAD7CD] pb-6 md:flex-row">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-[#DAD7CD] bg-white">
              <Leaf className="h-8 w-8 text-[#1B4332]" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#2B2B2B]">Landscaping Appointments</h2>
              <p className="mt-2 text-[#6B6B6B]">
                Schedule a consultation with our expert design team for your next big project.
              </p>
            </div>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="flex flex-col lg:flex-row">
              <div className="relative h-80 lg:h-auto lg:w-1/2">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1663185777721-a53e090dfecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBsYW5kc2NhcGluZyUyMHBhdGh8ZW58MXx8fHwxNzcyNzMxNjMxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Landscaping work"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[#1B4332]/20" />
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-[#DAD7CD] bg-white/95 p-6 shadow-sm backdrop-blur-sm">
                  <h4 className="mb-2 text-lg font-semibold text-[#2B2B2B]">Our Process</h4>
                  <ul className="space-y-2 text-sm text-[#6B6B6B]">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#2D6A4F]" /> Free On-Site Consultation
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#2D6A4F]" /> On the spot Assessment
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#2D6A4F]" /> Professional Installation
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col justify-center p-8 lg:w-1/2 lg:p-12">
                <h3 className="mb-4 text-2xl font-bold text-[#2B2B2B]">Book Your Free Consultation</h3>
                <p className="mb-6 text-[#6B6B6B]">
                  Our expert landscaping team is ready to transform your garden. Choose your preferred date and time from our interactive calendar, and we'll confirm your appointment right away.
                </p>

                <div className="mb-6 rounded-2xl border border-[#DAD7CD] bg-[#F5F0E6] p-6">
                  <h4 className="mb-3 font-semibold text-[#2B2B2B]">Consultation Includes:</h4>
                  <ul className="space-y-2 text-sm text-[#2B2B2B]">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2D6A4F]" /> Free site assessment</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2D6A4F]" /> Design recommendations</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2D6A4F]" /> Project timeline & pricing</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2D6A4F]" /> Landscaping expertise</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Button asChild className="w-full">
                    <Link to="/landscaping/booking">
                      <Calendar className="h-5 w-5" />
                      Schedule Now
                    </Link>
                  </Button>
                  <p className="text-center text-xs text-[#6B6B6B]">
                    ⏱️ Appointments available Monday-Sunday, 9 AM - 10 PM
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
