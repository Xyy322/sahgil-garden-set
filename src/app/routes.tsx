import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Services } from "./pages/Services";
import { Contact } from "./pages/Contact";
import { Login } from "./pages/Login";
import { CustomerDashboard } from "./pages/CustomerDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminProducts } from "./pages/AdminProducts";
import { AdminOrders } from "./pages/AdminOrders";
import { AdminAppointments } from "./pages/AdminAppointments";
import { AdminInquiries } from "./pages/AdminInquiries";
import { NotFound } from "./pages/NotFound";
import { Register } from "./pages/Register";
import { Checkout } from "./pages/Checkout";
import { LandscapingBooking } from "./pages/LandscapingBooking";
import { Profile } from "./pages/Profile";
import { ProfileEdit } from "./pages/ProfileEdit";
import { PasswordChange } from "./pages/PasswordChange";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { AdminLayout } from "./components/AdminLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      { path: "services", Component: Services },
      { path: "contact", Component: Contact },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "checkout", Component: Checkout },
      { path: "landscaping/booking", Component: LandscapingBooking },

      {
        path: "dashboard/customer",
        element: (
          <RoleProtectedRoute allowedRoles={["customer"]}>
            <CustomerDashboard />
          </RoleProtectedRoute>
        ),
      },

      {
        path: "profile",
        element: (
          <RoleProtectedRoute allowedRoles={["customer"]}>
            <Profile />
          </RoleProtectedRoute>
        ),
      },

      {
        path: "profile/edit",
        element: (
          <RoleProtectedRoute allowedRoles={["customer"]}>
            <ProfileEdit />
          </RoleProtectedRoute>
        ),
      },

      {
        path: "profile/password",
        element: (
          <RoleProtectedRoute allowedRoles={["customer"]}>
            <PasswordChange />
          </RoleProtectedRoute>
        ),
      },

      // ✅ ADMIN (FIXED — no route-level guard anymore)
      {
        path: "dashboard/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "products", element: <AdminProducts /> },
          { path: "orders", element: <AdminOrders /> },
          { path: "appointments", element: <AdminAppointments /> },
          { path: "inquiries", element: <AdminInquiries /> },
        ],
      },

      { path: "*", Component: NotFound },
    ],
  },
]);