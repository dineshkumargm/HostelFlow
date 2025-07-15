import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (user?.is_superuser) {
    return <>{children}</>;
  } else {
    return <Navigate to="/" />;
  }
};

export default AdminRoute;
