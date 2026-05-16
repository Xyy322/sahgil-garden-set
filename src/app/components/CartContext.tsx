// CartContext provides global state management for the shopping cart.
// It affects the system by enabling any component to read or modify the cart, supporting add, remove, and clear actions.
// This file uses React context and hooks to encapsulate cart logic and expose it to the app.
import { createContext, useContext, useState } from "react";

// CartItem defines the structure of an item in the cart.
export type CartItem = {
  id: string;        // Unique identifier for the item
  name: string;      // Name of the item
  price: number;     // Price per unit
  image?: string;    // Optional image URL
  quantity: number;  // Quantity in the cart
};

// CartContextType defines the shape of the cart context value.
interface CartContextType {
  items: CartItem[];                        // List of items in the cart
  addItem: (item: CartItem) => void;        // Function to add an item
  removeItem: (id: string) => void;         // Function to remove an item by id
  clearCart: () => void;                    // Function to clear the cart
}

// Create the cart context with undefined as default (enforced by custom hook).
const CartContext = createContext<CartContextType | undefined>(undefined);

// Custom hook to access the cart context from any component.
// Throws an error if used outside the CartProvider.
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

// CartProvider wraps the app and manages cart state.
// It exposes add, remove, and clear actions, and stores items in local state.
export function CartProvider({ children }: { children: React.ReactNode }) {
  // State to hold cart items (array of CartItem).
  const [items, setItems] = useState<CartItem[]>([]);

  // Add an item to the cart, or update quantity if it already exists.
  const addItem = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        // If item exists, update its quantity.
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      // Otherwise, add new item.
      return [...prev, item];
    });
  };

  // Remove an item from the cart by id.
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Clear all items from the cart.
  const clearCart = () => setItems([]);

  // Provide cart state and actions to children via context.
  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}
