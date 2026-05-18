import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { CartProvider } from "./components/CartContext";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
  <AuthProvider>
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  </AuthProvider>
);
}