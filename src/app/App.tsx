

// Import RouterProvider to enable routing in the app
import { RouterProvider } from "react-router";
// Import the router configuration
import { router } from "./routes.tsx";
// Import CartProvider to provide cart context to the app
import { CartProvider } from "./components/CartContext";



// Main App component that wraps the app with CartProvider and sets up routing
export default function App() {
  return (
    // Provide cart context to all child components
    <CartProvider>
      {/* Set up routing using the router configuration */}
      <RouterProvider router={router} />
    </CartProvider>
  );
}

