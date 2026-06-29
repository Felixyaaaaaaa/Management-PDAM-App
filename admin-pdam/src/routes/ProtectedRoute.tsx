import { Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../src/hooks/useAuth";
import { canAccessPath, getDefaultPathByRole } from "../lib/access";

export default function ProtectedRoute({ children }: any) {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const path = location.pathname;
  if (!canAccessPath(user.role, path)) {
    return <Navigate to={getDefaultPathByRole(user.role)} replace />;
  }

  return children;
}
