// frontend/src/pages/Dashboard.js
import React, { useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useCurrency } from "../hooks/useCurrency";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const fmtNum = (n) => new Intl.NumberFormat().format(n || 0);

function StatCard({ label, value, sub, icon, color = "blue" }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-lg ${colorMap[color] || colorMap.blue}`}
      >
        {icon}
      </div>
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-1.5">{sub}</div>}
    </div>
  );
}

// ── Sell Modal ─────────────────────────────────────────────────────────────────
function SellModal({ products, onClose, onSuccess }) {
  const { fmt } = useCurrency();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [priceType, setPriceType] = useState("rrp");
  const [customPrice, setCustomPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [priceErr, setPriceErr] = useState("");

  const filtered = products.filter(
    (p) =>
      p.quantity > 0 &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(search.toLowerCase())),
  );

  const minFloor = selected?.minimum_price ? Number(selected.minimum_price) : 0;

  const getPrice = () => {
    if (!selected) return 0;
    if (priceType === "rrp") return Number(selected.rrp);
    if (priceType === "minimum") return minFloor || Number(selected.rrp);
    return parseFloat(customPrice) || 0;
  };

  const validateCustom = (val) => {
    const n = parseFloat(val) || 0;
    if (minFloor > 0 && n < minFloor)
      setPriceErr(`Cannot go below minimum price of ${fmt(minFloor)}`);
    else setPriceErr("");
  };

  const total = getPrice() * qty;
  const profit = (getPrice() - Number(selected?.purchase_price || 0)) * qty;

  const handleSell = async () => {
    if (!selected) return alert("Please select a product first");
    if (qty < 1) return alert("Quantity must be at least 1");
    if (qty > selected.quantity)
      return alert(`Only ${selected.quantity} in stock`);
    const price = getPrice();
    if (!price) return alert("Enter a valid price");
    if (priceType === "other" && minFloor > 0 && price < minFloor)
      return alert(`Price cannot be below minimum price of ${fmt(minFloor)}`);
    setLoading(true);
    try {
      await axios.post("/api/sales", {
        product_id: selected.id,
        quantity_sold: qty,
        price_type: priceType,
        price_sold_at: price,
        notes,
      });
      onSuccess(selected.id, qty, price, {
        product_name: selected.name,
        seller_name: "You",
        price_sold_at: price,
        quantity_sold: qty,
        profit,
        sale_date: new Date().toISOString(),
        price_type: priceType,
      });
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || "Sale failed");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="text-lg font-bold text-gray-900">🛍️ Quick Sell</div>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-3 py-1 text-sm font-semibold transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-0 flex-1 overflow-hidden">
          {/* Product list */}
          <div className="flex flex-col gap-2 p-4 sm:w-[55%] border-b sm:border-b-0 sm:border-r border-gray-100 overflow-hidden">
            <input
              className="w-full rounded-lg text-sm border border-gray-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="🔍 Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <div className="overflow-y-auto flex-1 grid grid-cols-2 gap-2 content-start max-h-52 sm:max-h-none">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelected(p);
                    setQty(1);
                    setPriceType("rrp");
                    setCustomPrice("");
                  }}
                  className={`border-2 rounded-xl p-2.5 cursor-pointer text-center transition-all ${selected?.id === p.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300 bg-gray-50"}`}
                >
                  {p.photo_url ? (
                    <img
                      src={p.photo_url}
                      alt={p.name}
                      className="w-full h-12 object-cover rounded-lg mb-1.5"
                    />
                  ) : (
                    <div className="h-12 flex items-center justify-center text-2xl bg-white rounded-lg mb-1.5">
                      📦
                    </div>
                  )}
                  <div className="text-[11px] font-semibold leading-tight mb-0.5 text-gray-800">
                    {p.name}
                  </div>
                  <div className="text-[11px] font-bold text-blue-600">
                    {fmt(p.rrp)}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {p.quantity} left
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-2 text-center text-gray-400 py-8 text-sm">
                  No products in stock
                </div>
              )}
            </div>
          </div>
          {/* Sale form */}
          <div className="p-4 sm:w-[45%] overflow-y-auto">
            {!selected ? (
              <div className="text-center text-gray-400 pt-12 text-sm">
                ← Pick a product
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
                  <div className="font-bold text-sm mb-1 text-gray-900">
                    {selected.name}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Stock: {selected.quantity}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                      Retail: {fmt(selected.rrp)}
                    </span>
                    {selected.minimum_price && (
                      <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                        Min: {fmt(selected.minimum_price)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Quantity
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    type="number"
                    min="1"
                    max={selected.quantity}
                    value={qty}
                    onChange={(e) =>
                      setQty(Math.max(1, parseInt(e.target.value) || 1))
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Selling Price
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {[
                      {
                        key: "rrp",
                        label: "Retail Price",
                        badge: fmt(selected.rrp),
                        border: "border-blue-500",
                        bg: "bg-blue-50",
                        text: "text-blue-700",
                      },
                      ...(selected.minimum_price
                        ? [
                            {
                              key: "minimum",
                              label: "Minimum Price",
                              badge: fmt(selected.minimum_price),
                              border: "border-red-500",
                              bg: "bg-red-50",
                              text: "text-red-700",
                            },
                          ]
                        : []),
                      {
                        key: "other",
                        label: "Other Price",
                        badge: "enter below",
                        border: "border-purple-500",
                        bg: "bg-purple-50",
                        text: "text-purple-700",
                      },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border-2 transition-all ${priceType === opt.key ? `${opt.border} ${opt.bg}` : "border-gray-200"}`}
                      >
                        <input
                          type="radio"
                          name="priceTypeSell"
                          value={opt.key}
                          checked={priceType === opt.key}
                          onChange={() => {
                            setPriceType(opt.key);
                            setPriceErr("");
                            setCustomPrice("");
                          }}
                          className="accent-blue-600"
                        />
                        <span
                          className={`flex-1 text-[13px] font-semibold ${priceType === opt.key ? opt.text : "text-gray-700"}`}
                        >
                          {opt.label}
                        </span>
                        <span className={`text-xs font-bold ${opt.text}`}>
                          {opt.badge}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {priceType === "other" && (
                  <div className="mb-3">
                    <input
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 ${priceErr ? "border-red-400" : "border-gray-200"}`}
                      type="number"
                      value={customPrice}
                      onChange={(e) => {
                        setCustomPrice(e.target.value);
                        validateCustom(e.target.value);
                      }}
                      placeholder="0"
                      autoFocus
                    />
                    {priceErr && (
                      <div className="text-xs text-red-600 mt-1 font-semibold">
                        ❌ {priceErr}
                      </div>
                    )}
                  </div>
                )}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Notes
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional…"
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">{fmt(total)}</span>
                  </div>
                  <div
                    className={`flex justify-between text-xs mt-1 ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    <span>Est. profit</span>
                    <span>
                      {profit >= 0 ? "+" : ""}
                      {fmt(profit)}
                    </span>
                  </div>
                </div>
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-bold transition-colors"
                  onClick={handleSell}
                  disabled={loading || !getPrice() || !!priceErr}
                >
                  {loading ? "Processing…" : `Confirm Sale — ${fmt(total)}`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Product Modal ─────────────────────────────────────────────────────────
function AddProductModal({ onClose, onSuccess }) {
  const { fmt } = useCurrency();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    purchase_price: "",
    rrp: "",
    minimum_price: "",
    quantity: "",
    category: "",
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const validate = () => {
    if (!form.name.trim()) return "Product name is required";
    if (!form.purchase_price) return "Cost price is required";
    if (!form.rrp) return "Retail price is required";
    if (Number(form.rrp) < Number(form.purchase_price))
      return "Retail price should not be less than cost price";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ve = validate();
    if (ve) return setErr(ve);
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v !== "" && fd.append(k, v));
    if (photo) fd.append("photo", photo);
    try {
      const { data } = await axios.post("/api/products", fd);
      onSuccess({
        id: data.id,
        ...form,
        quantity: parseInt(form.quantity) || 0,
        minimum_price: form.minimum_price
          ? parseFloat(form.minimum_price)
          : null,
        is_active: 1,
        photo_url: null,
      });
      onClose();
    } catch (err) {
      setErr(err.response?.data?.error || "Error saving product");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="text-lg font-bold text-gray-900">➕ Add Product</div>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-3 py-1 text-sm font-semibold transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-5">
          {err && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-2.5 text-sm mb-4">
              ❌ {err}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Product Name *
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  SKU
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="font-bold text-sm text-green-800 mb-3">
                💰 Pricing
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    key: "purchase_price",
                    label: "Cost Price *",
                    hint: "Not shown to sellers",
                    required: true,
                  },
                  {
                    key: "rrp",
                    label: "Retail Price *",
                    hint: "Default sell price",
                    required: true,
                  },
                  {
                    key: "minimum_price",
                    label: "Minimum Price",
                    hint: "Sellers can't go below this",
                    hintClass: "text-red-500",
                  },
                ].map(({ key, label, hint, hintClass, required }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {label}
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      type="number"
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                      required={required}
                      min="0"
                    />
                    <div
                      className={`text-[11px] mt-0.5 ${hintClass || "text-gray-400"}`}
                    >
                      {hint}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Opening Quantity
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Category
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="e.g. Dairy…"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Photo (max 2MB)
              </label>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
              />
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-bold transition-colors"
                type="submit"
                disabled={loading}
              >
                {loading ? "Adding…" : "Add Product"}
              </button>
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
                type="button"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Seller Dashboard ──────────────────────────────────────────────────────────
function SellerDashboard({ computed, products, user, onSellSuccess }) {
  const { fmt } = useCurrency();
  const [showSell, setShowSell] = useState(false);
  const [quickSelected, setQuickSelected] = useState(null);
  const [quickQty, setQuickQty] = useState(1);
  const [quickPrice, setQuickPrice] = useState("rrp");
  const [quickCustom, setQuickCustom] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickMsg, setQuickMsg] = useState("");
  const [quickPriceErr, setQuickPriceErr] = useState("");

  const mySales = computed.myToday || [];
  const myRevenue = mySales.reduce(
    (a, s) => a + s.price_sold_at * s.quantity_sold,
    0,
  );
  const myItemsSold = mySales.reduce((a, s) => a + s.quantity_sold, 0);
  const totalStock = products.reduce((a, p) => a + p.quantity, 0);
  const inStockList = products.filter((p) => p.quantity > 0).slice(0, 10);

  const quickMinFloor = quickSelected?.minimum_price
    ? Number(quickSelected.minimum_price)
    : 0;

  const getQuickPrice = () => {
    if (!quickSelected) return 0;
    if (quickPrice === "rrp") return Number(quickSelected.rrp);
    if (quickPrice === "minimum")
      return quickMinFloor || Number(quickSelected.rrp);
    return parseFloat(quickCustom) || 0;
  };

  const handleQuickSell = async () => {
    if (!quickSelected) return;
    if (quickQty > quickSelected.quantity)
      return alert(`Only ${quickSelected.quantity} in stock`);
    const price = getQuickPrice();
    if (!price) return alert("Enter a valid price");
    setQuickLoading(true);
    try {
      await axios.post("/api/sales", {
        product_id: quickSelected.id,
        quantity_sold: quickQty,
        price_type: quickPrice,
        price_sold_at: price,
        notes: "",
      });
      const profit = (price - Number(quickSelected.purchase_price)) * quickQty;
      onSellSuccess(quickSelected.id, quickQty, price, {
        id: Date.now(),
        product_name: quickSelected.name,
        seller_name: user?.name || "You",
        seller_id: user?.id,
        price_sold_at: price,
        quantity_sold: quickQty,
        profit,
        sale_date: new Date().toISOString(),
        price_type: quickPrice,
        is_refunded: 0,
      });
      setQuickMsg(
        `✅ Sold ${quickQty}× ${quickSelected.name} — ${fmt(price * quickQty)}`,
      );
      setQuickSelected(null);
      setQuickQty(1);
      setQuickPrice("rrp");
      setQuickCustom("");
      setQuickPriceErr("");
      setTimeout(() => setQuickMsg(""), 4000);
    } catch (err) {
      alert(err.response?.data?.error || "Sale failed");
    }
    setQuickLoading(false);
  };

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => (window.location.href = "/inventory")}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl mb-3">
            📦
          </div>
          <div className="text-xs font-medium text-gray-500 mb-1">
            Total Inventory
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {fmtNum(totalStock)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {products.length} product lines
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl mb-3">
            🛍️
          </div>
          <div className="text-xs font-medium text-gray-500 mb-1">
            Products Sold
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {fmtNum(myItemsSold)}
          </div>
          <div className="text-xs text-gray-400 mt-1">items today</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl mb-3">
            💰
          </div>
          <div className="text-xs font-medium text-gray-500 mb-1">
            Day's Sales
          </div>
          <div className="text-xl font-bold text-green-600">
            {fmt(myRevenue)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {mySales.length} transactions
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div>
          {/* Sell CTA */}
          <div
            className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-dashed border-blue-300 rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-500 transition-colors min-h-[260px]"
            onClick={() => setShowSell(true)}
          >
            <div className="text-5xl sm:text-6xl">🛍️</div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-blue-700 mb-2">
                Sell Product
              </div>
              <div className="text-sm text-gray-500 max-w-xs">
                Tap to open the product picker and record a sale
              </div>
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-3 text-base font-bold shadow-lg shadow-blue-200 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowSell(true);
              }}
            >
              + New Sale
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl py-3.5 text-sm font-semibold transition-colors"
              onClick={() => (window.location.href = "/sales-log")}
            >
              📋 My Sales Log
            </button>
            <button
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl py-3.5 text-sm font-semibold transition-colors"
              onClick={() => (window.location.href = "/inventory")}
            >
              📦 View Inventory
            </button>
          </div>
        </div>

        {/* Quick Sales panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-bold text-sm bg-gray-50">
            ⚡ Quick Sales
          </div>
          <div className="p-3 border-b border-gray-100">
            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">
              Tap to select
            </div>
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
              {inStockList.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setQuickSelected(p);
                    setQuickQty(1);
                    setQuickPrice("rrp");
                    setQuickCustom("");
                  }}
                  className={`px-3 py-2 rounded-lg border-2 cursor-pointer flex justify-between items-center transition-all ${quickSelected?.id === p.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300 bg-white"}`}
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-800">
                      {p.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {p.quantity} in stock
                    </div>
                  </div>
                  <div className="text-sm font-bold text-blue-600">
                    {fmt(p.rrp)}
                  </div>
                </div>
              ))}
              {inStockList.length === 0 && (
                <div className="text-center text-gray-400 py-4 text-sm">
                  No products in stock
                </div>
              )}
            </div>
          </div>
          {quickSelected && (
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="text-xs font-bold mb-2">
                Selling: {quickSelected.name}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">Qty</div>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                    type="number"
                    min="1"
                    max={quickSelected.quantity}
                    value={quickQty}
                    onChange={(e) =>
                      setQuickQty(Math.max(1, parseInt(e.target.value) || 1))
                    }
                  />
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">Price</div>
                  <select
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500 bg-white"
                    value={quickPrice}
                    onChange={(e) => {
                      setQuickPrice(e.target.value);
                      setQuickCustom("");
                      setQuickPriceErr("");
                    }}
                  >
                    <option value="rrp">Retail {fmt(quickSelected.rrp)}</option>
                    {quickSelected.minimum_price && (
                      <option value="minimum">
                        Min {fmt(quickSelected.minimum_price)}
                      </option>
                    )}
                    <option value="other">Custom</option>
                  </select>
                </div>
              </div>
              {quickPrice === "other" && (
                <input
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm mb-2 outline-none focus:border-blue-500"
                  type="number"
                  value={quickCustom}
                  onChange={(e) => setQuickCustom(e.target.value)}
                  placeholder="Custom price…"
                />
              )}
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span className="text-gray-400">Total:</span>
                <span className="text-blue-600 font-bold">
                  {fmt(getQuickPrice() * quickQty)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-bold transition-colors"
                  onClick={handleQuickSell}
                  disabled={quickLoading || !getQuickPrice()}
                >
                  {quickLoading ? "…" : "✓ Sell"}
                </button>
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
                  onClick={() => setQuickSelected(null)}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          {quickMsg && (
            <div className="px-4 py-2.5 bg-green-50 text-green-700 text-sm font-semibold">
              {quickMsg}
            </div>
          )}
          <div className="p-3">
            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">
              Today's Activity
            </div>
            {mySales.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-3">
                No sales yet today
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {mySales.slice(0, 6).map((s, i) => (
                  <div
                    key={s.id || i}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <div className="text-xs font-semibold text-gray-800">
                        {s.product_name}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        ×{s.quantity_sold}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-blue-600 font-mono">
                      {fmt(s.price_sold_at * s.quantity_sold)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSell && (
        <SellModal
          products={products}
          onClose={() => setShowSell(false)}
          onSuccess={(pid, qty, price, sd) => {
            onSellSuccess(pid, qty, price, sd);
            setShowSell(false);
          }}
        />
      )}
    </>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, can } = useAuth();
  const { fmt } = useCurrency();
  const { products, sales, addProduct, addSale, deductStock } = useApp();
  const [showSell, setShowSell] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 5000);
  };

  const computed = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekStart = new Date(Date.now() - 6 * 86400000)
      .toISOString()
      .slice(0, 10);
    const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
    const activeSales = sales.filter((s) => !s.is_refunded);
    const sum = (arr) =>
      arr.reduce(
        (a, s) => ({
          count: a.count + 1,
          revenue: a.revenue + s.price_sold_at * s.quantity_sold,
          profit: a.profit + (Number(s.profit) || 0),
        }),
        { count: 0, revenue: 0, profit: 0 },
      );
    const daySales = activeSales.filter(
      (s) => s.sale_date?.slice(0, 10) === today,
    );
    const weekSales = activeSales.filter(
      (s) => s.sale_date?.slice(0, 10) >= weekStart,
    );
    const monthSales = activeSales.filter(
      (s) => s.sale_date?.slice(0, 10) >= monthStart,
    );
    const chartMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      chartMap[d] = { date: d, revenue: 0, profit: 0 };
    }
    weekSales.forEach((s) => {
      const d = s.sale_date?.slice(0, 10);
      if (chartMap[d]) {
        chartMap[d].revenue += s.price_sold_at * s.quantity_sold;
        chartMap[d].profit += Number(s.profit) || 0;
      }
    });
    return {
      day: { products_sold: daySales.length, ...sum(daySales) },
      week: { products_sold: weekSales.length, ...sum(weekSales) },
      month: { products_sold: monthSales.length, ...sum(monthSales) },
      inventory: {
        total_products: products.length,
        total_items: products.reduce((a, p) => a + p.quantity, 0),
        total_value: products.reduce(
          (a, p) => a + p.quantity * p.purchase_price,
          0,
        ),
      },
      chart: Object.values(chartMap),
      myToday: daySales.filter((s) => s.seller_id === user?.id),
    };
  }, [sales, products, user]);

  const handleSellSuccess = (productId, qty, priceSoldAt, saleData) => {
    deductStock(productId, qty, priceSoldAt);
    addSale({ id: Date.now(), ...saleData });
    showToast(`✅ Sale recorded — ${saleData.product_name}`);
  };

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] bg-green-50 text-green-800 border border-green-200 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg min-w-[280px]">
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-gray-200">
        <div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">
            Dashboard
          </div>
          <div className="text-sm text-gray-400 mt-0.5">
            Welcome back, {user?.name} 👋
          </div>
        </div>
        {can("manager", "group") && (
          <div className="flex gap-2 flex-wrap">
            <button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-bold shadow-md shadow-blue-200 transition-colors"
              onClick={() => setShowSell(true)}
            >
              <span>🛍️</span> Sell Product
            </button>
            <button
              className="flex items-center gap-2 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2 text-sm font-bold transition-colors"
              onClick={() => setShowAdd(true)}
            >
              <span>➕</span> Add Product
            </button>
          </div>
        )}
      </div>

      {can("seller") && (
        <SellerDashboard
          computed={computed}
          products={products}
          user={user}
          onSellSuccess={handleSellSuccess}
        />
      )}

      {can("manager", "group") && (
        <>
          {[
            {
              label: "📅 Today",
              cards: [
                {
                  label: "Products Sold",
                  value: fmtNum(computed.day.products_sold),
                  icon: "🛍️",
                  color: "purple",
                },
                {
                  label: "Today's Revenue",
                  value: fmt(computed.day.revenue),
                  icon: "💰",
                  color: "blue",
                },
                {
                  label: "Today's Profit",
                  value: fmt(computed.day.profit),
                  icon: "📈",
                  color: "green",
                },
              ],
            },
            {
              label: "📆 This Week",
              cards: [
                {
                  label: "Items Sold",
                  value: fmtNum(computed.week.products_sold),
                  icon: "📦",
                  color: "purple",
                },
                {
                  label: "Week Revenue",
                  value: fmt(computed.week.revenue),
                  icon: "💳",
                  color: "blue",
                },
                {
                  label: "Week Profit",
                  value: fmt(computed.week.profit),
                  icon: "🏆",
                  color: "green",
                },
              ],
            },
            {
              label: "🗓️ This Month",
              cards: [
                {
                  label: "Items Sold",
                  value: fmtNum(computed.month.products_sold),
                  icon: "📊",
                  color: "purple",
                },
                {
                  label: "Month Revenue",
                  value: fmt(computed.month.revenue),
                  icon: "🏦",
                  color: "blue",
                },
                {
                  label: "Month Profit",
                  value: fmt(computed.month.profit),
                  icon: "✅",
                  color: "green",
                },
              ],
            },
          ].map(({ label, cards }) => (
            <div key={label} className="mb-7">
              <div className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-3">
                {label}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {cards.map((c) => (
                  <StatCard key={c.label} {...c} />
                ))}
              </div>
            </div>
          ))}

          <div className="mb-7">
            <div className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-3">
              🏪 Current Inventory
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Product Lines"
                value={fmtNum(computed.inventory.total_products)}
                icon="🗂️"
                color="amber"
              />
              <StatCard
                label="Total Items Stock"
                value={fmtNum(computed.inventory.total_items)}
                icon="📦"
                color="amber"
              />
              <StatCard
                label="Stock Value (Cost)"
                value={fmt(computed.inventory.total_value)}
                icon="💵"
                color="amber"
              />
            </div>
          </div>

          {computed.chart.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="font-bold text-base mb-5 text-gray-900">
                📊 Sales — Last 7 Days
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={computed.chart} barCategoryGap="35%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v, n) => [
                      fmt(v),
                      n === "revenue" ? "Revenue" : "Profit",
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="profit" fill="#16a34a" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />{" "}
                  Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-green-600 inline-block" />{" "}
                  Profit
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {can("buyer") && (
        <>
          <div className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-3">
            📦 Inventory Overview
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <StatCard
              label="Product Lines"
              value={fmtNum(computed.inventory.total_products)}
              icon="🗂️"
              color="amber"
            />
            <StatCard
              label="Total Items"
              value={fmtNum(computed.inventory.total_items)}
              icon="📦"
              color="amber"
            />
            <StatCard
              label="Out of Stock"
              value={products.filter((p) => p.quantity === 0).length}
              icon="⚠️"
              color="red"
            />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-4xl">📦</div>
            <div className="flex-1">
              <div className="font-bold text-base mb-1 text-gray-900">
                Add new stock
              </div>
              <div className="text-sm text-gray-500">
                Go to Inventory to add products or update quantities.
              </div>
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-sm font-bold transition-colors whitespace-nowrap"
              onClick={() => (window.location.href = "/inventory")}
            >
              Go to Inventory →
            </button>
          </div>
        </>
      )}

      {showSell && (
        <SellModal
          products={products}
          onClose={() => setShowSell(false)}
          onSuccess={handleSellSuccess}
        />
      )}
      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          onSuccess={(p) => {
            addProduct(p);
            showToast("✅ Product added to inventory!");
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}
