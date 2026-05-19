import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "sahgil_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = sessionStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // sessionStorage unavailable, fail silently
    }
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);

      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }

      return [...prev, item];
    });

    toast.success("Added to cart", {
      description: `${item.name} has been added to your cart.`,
    });
  };

  const removeItem = (id: string) => {
    const itemToRemove = items.find((item) => item.id === id);

    setItems((prev) => prev.filter((i) => i.id !== id));

    if (itemToRemove) {
      toast.info("Removed from cart", {
        description: `${itemToRemove.name} has been removed from your cart.`,
      });
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    const itemToUpdate = items.find((item) => item.id === id);

    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );

    if (itemToUpdate) {
      toast.message("Cart updated", {
        description: `${itemToUpdate.name} quantity updated to ${quantity}.`,
      });
    }
  };

  const clearCart = () => {
    setItems([]);

    try {
      sessionStorage.removeItem(CART_KEY);
    } catch {
      // fail silently
    }
  };

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return ctx;
}