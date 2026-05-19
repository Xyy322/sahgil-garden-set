import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth, type AppRole } from "../context/AuthContext";

function AccessLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f7f4]">
      <div className="text-stone-600 text-lg">Verifying access...</div>
    </div>
  );
}

function fallbackPathForRole(role: AppRole) {
  return role === "admin" ? "/dashboard/admin" : "/dashboard/customer";
}

function AccessErrorPage({
  code,
  title,
  message,
  actionLabel,
  actionTo,
}: {
  code: string;
  title: string;
  message: string;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f7f4] px-6 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-lg border border-stone-200 p-8 text-center">
        <h1 className="text-7xl font-bold text-emerald-100 mb-4">
          {code}
        </h1>

        <h2 className="text-2xl font-bold text-stone-800 mb-3">
          {title}
        </h2>

        <p className="text-stone-600 mb-8 leading-relaxed">
          {message}
        </p>

        <Link
          to={actionTo}
          className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-emerald-700 transition-all shadow-md"
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}

export function RoleProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: AppRole[];
  children: ReactNode;
}) {
  const location = useLocation();
  const { user, role, loading, profileError } = useAuth();

  if (loading) {
    return <AccessLoader />;
  }

  if (!user) {
    return (
      <AccessErrorPage
        code="401"
        title="Login Required"
        message="You need to log in before accessing this protected page."
        actionLabel="Go to Login"
        actionTo="/login"
      />
    );
  }

  if (!role) {
    return (
      <AccessErrorPage
        code="403"
        title="Account Profile Error"
        message={
          profileError ||
          "Your account does not have a valid system role. Please contact the administrator."
        }
        actionLabel="Back to Login"
        actionTo="/login"
      />
    );
  }

  if (!allowedRoles.includes(role)) {
    const isTryingAdminPage = location.pathname.startsWith("/dashboard/admin");

    return (
      <AccessErrorPage
        code="403"
        title="Access Denied"
        message={
          isTryingAdminPage
            ? "This page is restricted to administrators only. Your account does not have permission to access the admin dashboard."
            : "This page is restricted and your account does not have permission to access it."
        }
        actionLabel={role === "admin" ? "Go to Admin Dashboard" : "Go to Home"}
        actionTo={fallbackPathForRole(role)}
      />
    );
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <AccessLoader />;
  }

  if (user && role) {
    return <Navigate to={fallbackPathForRole(role)} replace />;
  }

  return <>{children}</>;
}