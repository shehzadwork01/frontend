// frontend/src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(email, password, null);
      if (user.role === "super_admin") navigate("/superadmin");
      else
        setError(
          "Please use your shop's unique URL to log in (e.g. /shop/your-shop-link)",
        );
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
    setLoading(false);
  };

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
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            🔐
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-1">
            Super Admin Login
          </h1>
          <p className="text-sm text-gray-500">Kaduuka Management System</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-5 text-sm text-blue-800 leading-relaxed">
          <strong>Shop staff?</strong> Use your shop's unique login URL.
          <br />
          Ask your manager for the link — it looks like:
          <br />
          <code className="text-xs bg-blue-100 px-1.5 py-0.5 rounded mt-1 inline-block font-mono">
            yoursite.com/shop/xxxxxx
          </code>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="superadmin@kaduuka.com"
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
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
