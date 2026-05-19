import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import { router } from "./routes";
import { CartProvider } from "./components/CartContext";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />

        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={2500}
          toastOptions={{
            className: "rounded-xl border border-stone-200 shadow-lg",
          }}
        />
      </CartProvider>
    </AuthProvider>
  );
}