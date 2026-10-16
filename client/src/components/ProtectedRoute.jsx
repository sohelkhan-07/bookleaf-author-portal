import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute({ role }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session?.token || !session?.user) {
    return (
      <Navigate
        to={role === "admin" ? "/admin/login" : "/author/login"}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (session.user.role !== role) {
    return (
      <Navigate
        to={
          session.user.role === "admin"
            ? "/admin/dashboard"
            : "/author/dashboard"
        }
        replace
      />
    );
  }

  return <Outlet />;
}
