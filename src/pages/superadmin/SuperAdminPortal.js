// frontend/src/pages/superadmin/SuperAdminPortal.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);

export default function SuperAdminPortal() {
  const { logout } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [editShop, setEditShop] = useState(null);
  const [form, setForm] = useState({
    shop_name: "",
    shop_address: "",
    shop_phone: "",
    shop_currency: "UGX",
    admin_name: "",
    admin_email: "",
    admin_password: "",
  });
  const [creating, setCreating] = useState(false);

  const loadShops = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/shops");
      setShops(data);
    } catch (err) {
      showMsg(
        "❌ Failed to load shops: " +
          (err.response?.data?.error || err.message),
        "error",
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const showMsg = (text, type = "success") => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(""), 6000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await axios.post("/api/shops", form);
      showMsg(
        `✅ Shop "${form.shop_name}" created! URL: ${window.location.origin}/shop/${data.slug}`,
      );
      setShowForm(false);
      setForm({
        shop_name: "",
        shop_address: "",
        shop_phone: "",
        shop_currency: "UGX",
        admin_name: "",
        admin_email: "",
        admin_password: "",
      });
      loadShops();
    } catch (err) {
      showMsg(
        "❌ " + (err.response?.data?.error || "Failed to create shop"),
        "error",
      );
    }
    setCreating(false);
  };

  const handleToggle = async (shop) => {
    try {
      await axios.put(`/api/shops/${shop.id}/toggle`);
      setShops((prev) =>
        prev.map((s) =>
          s.id === shop.id ? { ...s, is_active: !s.is_active } : s,
        ),
      );
    } catch (err) {
      showMsg("❌ " + (err.response?.data?.error || "Failed"), "error");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/shops/${editShop.id}`, {
        name: editShop.name,
        address: editShop.address,
        phone: editShop.phone,
        currency: editShop.currency,
      });
      showMsg("✅ Shop updated");
      setEditShop(null);
      loadShops();
    } catch (err) {
      showMsg(
        "❌ " + (err.response?.data?.error || "Failed to update"),
        "error",
      );
    }
  };

  const copyUrl = (slug) => {
    navigator.clipboard
      .writeText(`${window.location.origin}/shop/${slug}`)
      .then(() => {
        setCopiedSlug(slug);
        setTimeout(() => setCopiedSlug(null), 2500);
      });
  };

  const totalShops = shops.length;
  const activeShops = shops.filter((s) => s.is_active).length;
  const totalRevenue = shops.reduce(
    (a, s) => a + Number(s.total_revenue || 0),
    0,
  );
  const totalUsers = shops.reduce((a, s) => a + Number(s.user_count || 0), 0);

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all";

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top bar */}
      <div className="bg-gray-900 text-white px-4 sm:px-7 flex items-center justify-between h-14 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏗️</span>
          <div>
            <div className="font-extrabold text-base leading-tight">
              Kaduuka HQ
            </div>
            <div className="text-[11px] text-gray-400 leading-tight">
              Super Admin Portal
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors"
          >
            {showForm ? "✕ Cancel" : "+ New Shop"}
          </button>
          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="text-gray-400 border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-2 text-sm transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7">
        {msg && (
          <div
            className={`rounded-xl px-4 py-3 mb-5 text-sm border ${msgType === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}
          >
            {msg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {[
            {
              label: "Total Shops",
              value: totalShops,
              icon: "🏪",
              color: "text-blue-600",
            },
            {
              label: "Active Shops",
              value: activeShops,
              icon: "✅",
              color: "text-green-600",
            },
            {
              label: "Total Users",
              value: totalUsers,
              icon: "👥",
              color: "text-purple-600",
            },
            {
              label: "Combined Revenue",
              value: fmt(totalRevenue),
              icon: "💰",
              color: "text-amber-600",
            },
          ].map(({ label, value, icon, color }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm"
            >
              <div className="text-2xl mb-2">{icon}</div>
              <div className={`text-xl font-extrabold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Create Shop Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-7">
            <h3 className="text-lg font-extrabold text-gray-900 mb-6">
              🏪 Create New Shop
            </h3>
            <form onSubmit={handleCreate}>
              <div className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-3">
                Shop Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Shop Name *
                  </label>
                  <input
                    className={inputClass}
                    value={form.shop_name}
                    onChange={(e) =>
                      setForm({ ...form, shop_name: e.target.value })
                    }
                    placeholder="e.g. Kampala Branch"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Currency
                  </label>
                  <select
                    className={inputClass}
                    value={form.shop_currency}
                    onChange={(e) =>
                      setForm({ ...form, shop_currency: e.target.value })
                    }
                  >
                    <option value="UGX">UGX — Uganda Shilling</option>
                    <option value="KES">KES — Kenya Shilling</option>
                    <option value="TZS">TZS — Tanzania Shilling</option>
                    <option value="NGN">NGN — Nigerian Naira</option>
                    <option value="GHS">GHS — Ghana Cedi</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="ZAR">ZAR — South African Rand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Address (optional)
                  </label>
                  <input
                    className={inputClass}
                    value={form.shop_address}
                    onChange={(e) =>
                      setForm({ ...form, shop_address: e.target.value })
                    }
                    placeholder="Plot 14, Nakasero Road"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Phone (optional)
                  </label>
                  <input
                    className={inputClass}
                    value={form.shop_phone}
                    onChange={(e) =>
                      setForm({ ...form, shop_phone: e.target.value })
                    }
                    placeholder="+256 700 000 000"
                  />
                </div>
              </div>
              <div className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-3">
                Shop Admin Account
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Admin Full Name *
                    </label>
                    <input
                      className={inputClass}
                      value={form.admin_name}
                      onChange={(e) =>
                        setForm({ ...form, admin_name: e.target.value })
                      }
                      placeholder="John Mugisha"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Admin Email *
                    </label>
                    <input
                      className={inputClass}
                      type="email"
                      value={form.admin_email}
                      onChange={(e) =>
                        setForm({ ...form, admin_email: e.target.value })
                      }
                      placeholder="john@kampala-branch.com"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Admin Password *
                    </label>
                    <input
                      className={inputClass}
                      type="password"
                      value={form.admin_password}
                      onChange={(e) =>
                        setForm({ ...form, admin_password: e.target.value })
                      }
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      💡 Share these credentials with the shop manager — they
                      log in at the shop's unique URL
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg px-6 py-2.5 text-sm font-bold transition-colors"
                >
                  {creating ? "Creating…" : "🏪 Create Shop & Admin"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Shop Modal */}
        {editShop && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-extrabold text-gray-900 mb-5">
                ✏️ Edit Shop
              </h3>
              <form onSubmit={handleEdit}>
                <div className="flex flex-col gap-3.5 mb-5">
                  {[
                    ["name", "Shop Name"],
                    ["address", "Address"],
                    ["phone", "Phone"],
                    ["currency", "Currency"],
                  ].map(([k, label]) => (
                    <div key={k}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        {label}
                      </label>
                      <input
                        className={inputClass}
                        value={editShop[k] || ""}
                        onChange={(e) =>
                          setEditShop({ ...editShop, [k]: e.target.value })
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-sm font-bold transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditShop(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Shops list */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="font-extrabold text-base text-gray-900">
              All Shops ({shops.length})
            </div>
            <button
              onClick={loadShops}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-sm transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              Loading shops…
            </div>
          ) : shops.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">🏪</div>
              <div className="font-bold text-gray-700 mb-1">No shops yet</div>
              <div className="text-sm text-gray-400">
                Click "New Shop" to create your first shop
              </div>
            </div>
          ) : (
            shops.map((shop) => {
              const shopUrl = `${window.location.origin}/shop/${shop.slug}`;
              return (
                <div
                  key={shop.id}
                  className={`p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 transition-opacity ${shop.is_active ? "opacity-100 bg-white" : "opacity-60 bg-gray-50"}`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${shop.is_active ? "bg-blue-50" : "bg-gray-100"}`}
                  >
                    🏪
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-2">
                      <span className="font-extrabold text-base text-gray-900">
                        {shop.name}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${shop.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        ● {shop.is_active ? "Active" : "Inactive"}
                      </span>
                      <span className="text-xs text-gray-400">
                        ID #{shop.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 mb-3 max-w-lg">
                      <span className="text-xs text-gray-500 flex-1 font-mono truncate">
                        🔗 {shopUrl}
                      </span>
                      <button
                        onClick={() => copyUrl(shop.slug)}
                        className={`rounded px-2.5 py-1 text-[11px] font-bold transition-colors shrink-0 ${copiedSlug === shop.slug ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"}`}
                      >
                        {copiedSlug === shop.slug ? "✓ Copied" : "Copy URL"}
                      </button>
                      <a
                        href={shopUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-2.5 py-1 text-[11px] font-semibold transition-colors no-underline shrink-0"
                      >
                        Open ↗
                      </a>
                    </div>
                    <div className="flex gap-4 flex-wrap text-sm text-gray-500">
                      {shop.admin_name && (
                        <span>
                          👔{" "}
                          <strong className="text-gray-800">
                            {shop.admin_name}
                          </strong>{" "}
                          <span className="text-xs">({shop.admin_email})</span>
                        </span>
                      )}
                      {shop.address && <span>📍 {shop.address}</span>}
                      {shop.phone && <span>📞 {shop.phone}</span>}
                      <span>💱 {shop.currency}</span>
                      <span>👥 {shop.user_count} users</span>
                      <span>📦 {shop.product_count} products</span>
                      <span className="text-amber-600 font-semibold">
                        💰 {fmt(shop.total_revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 items-start sm:items-end shrink-0">
                    <button
                      onClick={() => setEditShop({ ...shop })}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleToggle(shop)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${shop.is_active ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                    >
                      {shop.is_active ? "⏸ Deactivate" : "▶ Activate"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="mt-5 text-xs text-gray-400 text-center">
          Kaduuka Super Admin Portal · Each shop runs at its own unique URL
        </div>
      </div>
    </div>
  );
}
