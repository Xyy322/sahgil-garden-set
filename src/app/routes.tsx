import { createBrowserRouter } from "react-router-dom";
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
import { AdminReports } from "./pages/AdminReports";
import {
  RoleProtectedRoute,
  PublicOnlyRoute,
} from "./components/RoleProtectedRoute";
import { AdminLayout } from "./components/AdminLayout";
import { CustomerInquiries } from "./pages/CustomerInquiries";
export const router = createBrowserRouter([
  {
  path: "/",
  element: <Root />,
  children: [
    { index: true, element: <Home /> },
    { path: "about", element: <About /> },
    { path: "services", element: <Services /> },
    { path: "contact", element: <Contact /> },
    {
  path: "login",
  element: (
    <PublicOnlyRoute>
      <Login />
    </PublicOnlyRoute>
  ),
},
    {
  path: "register",
  element: (
    <PublicOnlyRoute>
      <Register />
    </PublicOnlyRoute>
  ),
},

    {
      path: "checkout",
      element: (
        <RoleProtectedRoute allowedRoles={["customer"]}>
          <Checkout />
        </RoleProtectedRoute>
      ),
    },

    {
      path: "landscaping/booking",
      element: (
        <RoleProtectedRoute allowedRoles={["customer"]}>
          <LandscapingBooking />
        </RoleProtectedRoute>
      ),
    },

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
  path: "inquiries",
  element: (
    <RoleProtectedRoute allowedRoles={["customer"]}>
      <CustomerInquiries />
    </RoleProtectedRoute>
  ),
},

{
  path: "dashboard/customer/inquiries",
  element: (
    <RoleProtectedRoute allowedRoles={["customer"]}>
      <CustomerInquiries />
    </RoleProtectedRoute>
  ),
},

    {
      path: "dashboard/admin",
      element: (
        <RoleProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout />
        </RoleProtectedRoute>
      ),
      children: [
        { index: true, element: <AdminDashboard /> },
        { path: "products", element: <AdminProducts /> },
        { path: "orders", element: <AdminOrders /> },
        { path: "appointments", element: <AdminAppointments /> },
        { path: "inquiries", element: <AdminInquiries /> },
        { path: "reports", element: <AdminReports /> },
      ],
    },

    { path: "*", element: <NotFound /> },
  ],
}
]);