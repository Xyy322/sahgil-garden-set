import { useEffect, useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ShoppingCart, Calendar, Leaf, Armchair } from "lucide-react";
import { Link, useNavigate } from "react-router";
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-card border-b border-border px-4 py-16 text-center md:px-6 md:py-20">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">
          Our Services
        </h1>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-xl">
          We bring two distinct areas of expertise to transform your outdoor space.
        </p>
      </div>

      <div className="mx-auto max-w-[1280px] space-y-20 px-4 py-14 md:px-6 md:py-16">
        <section id="furniture">
          <div className="mb-10 flex flex-col items-center gap-4 border-b border-border pb-6 md:flex-row">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-card">
              <Armchair className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">
                Furniture Catalog & Ordering
              </h2>
              <p className="text-muted-foreground">
                Browse and order handcrafted furniture.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-96 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className="p-0 overflow-hidden">
                  <div className="h-64">
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-semibold">
                      {product.name}
                    </h3>
                    <p className="mb-4 text-muted-foreground">
                      {product.description}
                    </p>

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
            <Link
              to="/contact"
              className="text-primary font-semibold hover:underline"
            >
              Request Custom Build
            </Link>
          </div>
        </section>

        <section id="landscaping">
          <div className="mb-10 flex flex-col items-center gap-4 border-b border-border pb-6 md:flex-row">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-card">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">
                Landscaping Appointments
              </h2>
              <p className="text-muted-foreground">
                Book consultations with our experts.
              </p>
            </div>
          </div>

          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-4">
              Book Your Free Consultation
            </h3>

            <Button asChild className="w-full">
              <Link to="/landscaping/booking">
                <Calendar className="h-5 w-5" />
                Schedule Now
              </Link>
            </Button>
          </Card>
        </section>
      </div>
    </div>
  );
}