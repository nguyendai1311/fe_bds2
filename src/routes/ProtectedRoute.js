// PrivateRoute.js
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = ({ allowedRoles, userRole }) => {
  if (!userRole) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />; // Render tất cả các child route
};

export default PrivateRoute;
