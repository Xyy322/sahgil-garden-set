// Cart displays the user's current shopping cart and allows item removal, clearing, and checkout navigation.
// It directly affects the system by enabling users to manage their cart contents and proceed to checkout.
// This file integrates with CartContext for state and uses React Router for navigation.
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";

export function Cart() {
  // Access cart items and manipulation functions from context.
  const { items, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  // If the cart is empty, show a message to the user.
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-stone-500 text-base">Your cart is empty.</div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-sm border border-stone-100 space-y-6">
      <h2 className="text-xl font-bold mb-2 text-stone-900">Your Cart</h2>
      <ul className="divide-y divide-stone-100 mb-2">
        {items.map(item => (
          <li key={item.id} className="flex items-center justify-between py-3 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-stone-200" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 font-bold">?</div>
              )}
              <div className="min-w-0">
                <div className="font-medium text-stone-800 truncate">{item.name}</div>
                <div className="text-xs text-stone-500">Qty: {item.quantity}</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="font-bold text-stone-900">₱{item.price * item.quantity}</span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-xs text-red-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded"
                aria-label={`Remove ${item.name} from cart`}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-stone-100 pt-4">
        <button
          onClick={clearCart}
          className="text-sm text-stone-500 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded px-2 py-1"
        >
          Clear Cart
        </button>
        <span className="font-bold text-lg text-stone-900">
          Total: ₱{items.reduce((sum, i) => sum + i.price * i.quantity, 0)}
        </span>
      </div>
      <button
        onClick={() => navigate("/checkout")}
        className="w-full mt-2 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
