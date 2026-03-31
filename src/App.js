// frontend/src/App.js
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./index.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sell from "./pages/Sell";
import SalesLog from "./pages/SalesLog";
import Totals from "./pages/Totals";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";
import CashUp from "./pages/CashUp";
import Sidebar from "./components/Sidebar";
import ShopEntry from "./pages/ShopEntry";
import SuperAdminPortal from "./pages/superadmin/SuperAdminPortal";

// ── Layout wrapper with mobile hamburger ─────────────────────────────────────
function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:ml-[230px] min-h-screen bg-gray-50">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="text-white font-bold text-base">🏪 Kaduuka</span>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </>
  );
}

// ── Loading spinner ───────────────────────────────────────────────────────────
function LoadingScreen({ message = "Loading Kaduuka…" }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-gray-400">
      <div className="text-4xl">🏪</div>
      <div className="text-sm font-medium">{message}</div>
    </div>
  );
}

// ── Private route ─────────────────────────────────────────────────────────────
function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) {
    try {
      const saved = JSON.parse(localStorage.getItem("kUser") || "{}");
      if (saved?.shop_slug)
        return <Navigate to={`/shop/${saved.shop_slug}`} replace />;
    } catch (_) {}
    return <Navigate to="/login" replace />;
  }
  if (user.role === "super_admin") return <Navigate to="/superadmin" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

// ── Super admin route ─────────────────────────────────────────────────────────
function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen message="Loading…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "super_admin") return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Main routes ───────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();
  const { loading: dataLoading } = useApp();

  if (user && user.role !== "super_admin" && dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-gray-400">
        <div className="text-4xl">🏪</div>
        <div className="font-semibold text-base text-gray-700">
          Loading your shop data…
        </div>
        <div className="text-sm">This happens once per session</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/shop/:slug" element={<ShopEntry />} />
      <Route
        path="/superadmin"
        element={
          <SuperAdminRoute>
            <SuperAdminPortal />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/login"
        element={
          !user ? (
            <Login />
          ) : user.role === "super_admin" ? (
            <Navigate to="/superadmin" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <PrivateRoute roles={["manager", "group", "buyer"]}>
            <Inventory />
          </PrivateRoute>
        }
      />
      <Route
        path="/totals"
        element={
          <PrivateRoute roles={["seller"]}>
            <Totals />
          </PrivateRoute>
        }
      />
      <Route
        path="/sell"
        element={
          <PrivateRoute roles={["seller", "manager", "group"]}>
            <Sell />
          </PrivateRoute>
        }
      />
      <Route
        path="/sales-log"
        element={
          <PrivateRoute roles={["seller", "manager", "group"]}>
            <SalesLog />
          </PrivateRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PrivateRoute roles={["manager", "group"]}>
            <Reports />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute roles={["manager", "group"]}>
            <Admin />
          </PrivateRoute>
        }
      />
      <Route
        path="/cash-up"
        element={
          <PrivateRoute roles={["manager", "group"]}>
            <CashUp />
          </PrivateRoute>
        }
      />
      <Route
        path="*"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : user.role === "super_admin" ? (
            <Navigate to="/superadmin" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
    </Routes>
  );
}

function AuthAppBridge({ children }) {
  const { loadAll, reset } = useApp();
  return (
    <AuthProvider onLogin={loadAll} onLogout={reset}>
      {children}
    </AuthProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AuthAppBridge>
          <AppRoutes />
        </AuthAppBridge>
      </BrowserRouter>
    </AppProvider>
  );
}
