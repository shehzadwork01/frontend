// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import {
  storeTokenForSW,
  triggerOfflineSync,
} from "../serviceWorkerRegistration";

const AuthContext = createContext(null);

export const AuthProvider = ({ children, onLogin, onLogout }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("kToken");
    const saved = localStorage.getItem("kUser");
    if (token && saved) {
      const u = JSON.parse(saved);
      setUser(u);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      if (onLogin) onLogin(u.role);
    }
    setLoading(false);
  }, []);

  // login now requires shop_id so the backend scopes the email lookup to that shop.
  // shop_id comes from the /shop/:slug page — the slug is resolved to shop_id before calling login.
  // Super admin login passes no shop_id (null).
  const login = async (
    email,
    password,
    shop_id = null,
    shop_currency = null,
  ) => {
    const { data } = await axios.post("/api/auth/login", {
      email,
      password,
      shop_id,
    });
    // ── Enrich user object with shop_currency ──────────────────────────────
    // shop_currency is passed from ShopEntry (which already fetched /api/shop-validate/:slug)
    // We store it on the user object so useCurrency() can read it anywhere in the app.
    const enrichedUser = {
      ...data.user,
      shop_currency: shop_currency || data.user.shop_currency || "UGX",
    };
    localStorage.setItem("kToken", data.token);
    localStorage.setItem("kUser", JSON.stringify(enrichedUser));
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser(enrichedUser);
    // Store token for service worker (offline sale sync) + flush any queued sales
    storeTokenForSW(data.token);
    triggerOfflineSync();
    if (onLogin) onLogin(enrichedUser.role);
    return enrichedUser;
  };

  const logout = () => {
    localStorage.removeItem("kToken");
    localStorage.removeItem("kUser");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    if (onLogout) onLogout();
  };

  const can = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
