// frontend/src/pages/ShopEntry.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function ShopEntry() {
  const { slug } = useParams();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [validating, setValidating] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`/api/shop-validate/${slug}`)
      .then(({ data }) => {
        setShop(data);
        setValidating(false);
      })
      .catch(() => {
        setNotFound(true);
        setValidating(false);
      });
  }, [slug]);

  useEffect(() => {
    if (user && shop) navigate("/dashboard", { replace: true });
  }, [user, shop]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password, shop.id, shop.currency);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error || "Login failed. Check your credentials.",
      );
    }
    setLoading(false);
  };

  if (validating)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="text-5xl">🏪</div>
        <div className="text-gray-500 text-sm">Loading shop…</div>
      </div>
    );

  if (notFound)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-4">
        <div className="text-6xl">🔍</div>
        <h2 className="text-xl font-bold text-gray-900">Shop Not Found</h2>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          This shop URL is invalid or the shop has been deactivated. Contact
          your manager for the correct link.
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-5 relative">
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="bg-white rounded-2xl p-8 sm:p-10 w-full max-w-sm shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="w-18 h-18 w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
            🏪
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-1">
            {shop.name}
          </h1>
          <p className="text-sm text-gray-500">
            Kaduuka Shop Management System
          </p>
          {shop.currency && shop.currency !== "USD" && (
            <div className="inline-block mt-2 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-3 py-1 rounded-full">
              Currency: {shop.currency}
            </div>
          )}
        </div>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@shop.com"
              required
              autoFocus
            />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg px-3.5 py-2.5 text-sm mb-4">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-blue-200 transition-all"
          >
            {loading ? "Signing in…" : "Sign In to Shop"}
          </button>
        </form>
        <p className="text-center mt-5 text-xs text-gray-400">
          Contact your manager if you need access
        </p>
      </div>
    </div>
  );
}
