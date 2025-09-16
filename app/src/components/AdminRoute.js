import React from "react";
import { Navigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import { useAdminAuth } from "../hooks/useAdminAuth";

/**
 * AdminRoute component that protects admin-only routes
 * Redirects non-admin users to home page
 */
const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin, adminLoading } = useAdminAuth();

  // Show loading while checking authentication and admin status
  if (loading || adminLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Redirect to home if not admin
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  // Render admin content if user is admin
  return children;
};

export default AdminRoute;