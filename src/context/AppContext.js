// frontend/src/context/AppContext.js
// ── Global data cache — fetches everything ONCE on login, stores in memory ──
// This dramatically reduces API calls on slow/expensive African internet.
import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [dashStats, setDashStats] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Call this once after login — pulls everything needed for the whole session.
  // SKIPPED entirely for super_admin — they have their own portal with their own data.
  const loadAll = useCallback(async (role) => {
    if (role === "super_admin") {
      // Super admin never loads shop data — mark as loaded immediately so
      // the app doesn't hang on the "Loading your shop data…" screen.
      setLoaded(true);
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const isManager = ["manager", "group"].includes(role);

      const requests = [
        axios.get("/api/products"),
        axios.get("/api/sales?limit=500"),
      ];
      if (isManager) {
        requests.push(axios.get("/api/auth/users"));
        requests.push(axios.get("/api/reports/dashboard"));
      }

      const results = await Promise.allSettled(requests);

      if (results[0].status === "fulfilled") setProducts(results[0].value.data);
      if (results[1].status === "fulfilled") setSales(results[1].value.data);
      if (isManager) {
        if (results[2].status === "fulfilled") setUsers(results[2].value.data);
        if (results[3].status === "fulfilled")
          setDashStats(results[3].value.data);
      }
      setLoaded(true);
    } catch (err) {
      console.error("loadAll error:", err.message);
      setLoaded(true); // still mark loaded so the app doesn't freeze
    }
    setLoading(false);
  }, []);

  // ── Optimistic updates — update local cache without re-fetching ─────────────

  const addProduct = (product) => setProducts((prev) => [...prev, product]);

  const updateProduct = (id, changes) =>
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    );

  const removeProduct = (id) =>
    setProducts((prev) => prev.filter((p) => p.id !== id));

  const addSale = (sale) => setSales((prev) => [sale, ...prev]);

  const addUser = (user) => setUsers((prev) => [user, ...prev]);

  const toggleUserActive = (id) =>
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u)),
    );

  // Deduct stock locally after a sale — no re-fetch needed
  const deductStock = (productId, qty, priceSoldAt) =>
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, quantity: p.quantity - qty, last_price: priceSoldAt }
          : p,
      ),
    );

  const reset = () => {
    setProducts([]);
    setSales([]);
    setUsers([]);
    setDashStats(null);
    setLoaded(false);
  };

  return (
    <AppContext.Provider
      value={{
        products,
        sales,
        users,
        dashStats,
        loaded,
        loading,
        loadAll,
        reset,
        addProduct,
        updateProduct,
        removeProduct,
        addSale,
        deductStock,
        addUser,
        toggleUserActive,
        // Allow manual refresh of a single resource when truly needed
        refreshProducts: () =>
          axios.get("/api/products").then((r) => setProducts(r.data)),
        refreshSales: () =>
          axios.get("/api/sales?limit=500").then((r) => setSales(r.data)),
        refreshUsers: () =>
          axios.get("/api/auth/users").then((r) => setUsers(r.data)),
        refreshDash: () =>
          axios.get("/api/reports/dashboard").then((r) => setDashStats(r.data)),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
