// frontend/src/pages/Sell.js
import React, { useState } from "react";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { useCurrency } from "../hooks/useCurrency";

export default function Sell() {
  const { products, deductStock, addSale } = useApp();
  const { fmt } = useCurrency();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [priceType, setPriceType] = useState("rrp");
  const [customPrice, setCustomPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [priceErr, setPriceErr] = useState("");

  const filtered = products.filter(
    (p) =>
      p.quantity > 0 &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(search.toLowerCase())),
  );

  const syncSelected = selected
    ? products.find((p) => p.id === selected.id) || selected
    : null;
  const minFloor = syncSelected?.minimum_price
    ? Number(syncSelected.minimum_price)
    : 0;

  const getPrice = () => {
    if (!syncSelected) return 0;
    if (priceType === "rrp") return Number(syncSelected.rrp);
    if (priceType === "minimum") return minFloor || Number(syncSelected.rrp);
    return parseFloat(customPrice) || 0;
  };

  const validateCustom = (val) => {
    const n = parseFloat(val) || 0;
    if (minFloor > 0 && n < minFloor)
      setPriceErr(`Cannot go below minimum price of ${fmt(minFloor)}`);
    else setPriceErr("");
  };

  const total = getPrice() * qty;
  const profit = (getPrice() - Number(syncSelected?.purchase_price || 0)) * qty;

  const handleSell = async () => {
    if (!syncSelected) return alert("Please select a product first");
    if (qty < 1) return alert("Quantity must be at least 1");
    if (qty > syncSelected.quantity)
      return alert(`Only ${syncSelected.quantity} in stock`);
    if (!getPrice()) return alert("Enter a valid price");
    if (priceType === "other" && minFloor > 0 && getPrice() < minFloor)
      return alert(`Price cannot be below minimum price of ${fmt(minFloor)}`);
    setLoading(true);
    try {
      const { data } = await axios.post("/api/sales", {
        product_id: syncSelected.id,
        quantity_sold: qty,
        price_type: priceType,
        price_sold_at: getPrice(),
        notes,
      });
      deductStock(syncSelected.id, qty, getPrice());
      addSale({
        id: data.id || Date.now(),
        product_id: syncSelected.id,
        product_name: syncSelected.name,
        seller_name: "You",
        quantity_sold: qty,
        price_sold_at: getPrice(),
        price_type: priceType,
        profit,
        sale_date: new Date().toISOString(),
        is_refunded: 0,
      });
      setSuccess(`✅ Sold ${qty}× ${syncSelected.name} for ${fmt(total)}`);
      setSelected(null);
      setQty(1);
      setPriceType("rrp");
      setCustomPrice("");
      setNotes("");
      setPriceErr("");
      setTimeout(() => setSuccess(""), 6000);
    } catch (err) {
      alert(err.response?.data?.error || "Sale failed");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="pb-5 mb-6 border-b border-gray-200">
        <div className="text-xl sm:text-2xl font-bold text-gray-900">
          Sell Product
        </div>
        <div className="text-sm text-gray-400 mt-0.5">
          Select a product then confirm the sale
        </div>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-2.5 text-sm font-medium mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4">
            <input
              className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
              placeholder="🔍 Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelected(p);
                  setQty(1);
                  setPriceType("rrp");
                  setCustomPrice("");
                  setPriceErr("");
                }}
                className={`bg-white rounded-xl p-3 cursor-pointer transition-all border-2 text-center ${selected?.id === p.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
              >
                {p.photo_url ? (
                  <img
                    src={p.photo_url}
                    alt={p.name}
                    className="w-14 h-14 object-cover rounded-lg mb-2 mx-auto"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-2xl mb-2 mx-auto">
                    📦
                  </div>
                )}
                <h4 className="text-xs font-semibold text-gray-800 mb-0.5 leading-tight">
                  {p.name}
                </h4>
                <div className="text-xs font-bold text-blue-600">
                  {fmt(p.rrp)}
                </div>
                <small className="text-[11px] text-gray-400">
                  {p.quantity} left
                </small>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-gray-400 py-12">
                {search
                  ? `No products matching "${search}"`
                  : "No products with stock"}
              </div>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              🧾 Sale Details
            </h3>
            {!syncSelected ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                ← Select a product to begin
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                  <div className="font-bold text-sm text-gray-900 mb-1">
                    {syncSelected.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    RRP: {fmt(syncSelected.rrp)} · Stock:{" "}
                    {syncSelected.quantity}
                  </div>
                  {syncSelected.minimum_price && (
                    <div className="text-xs text-red-600 font-semibold mt-1">
                      Min price: {fmt(syncSelected.minimum_price)}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Quantity
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    type="number"
                    min="1"
                    max={syncSelected.quantity}
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
                        badge: fmt(syncSelected.rrp),
                        color: "blue",
                      },
                      ...(syncSelected.minimum_price
                        ? [
                            {
                              key: "minimum",
                              label: "Minimum Price",
                              badge: fmt(syncSelected.minimum_price),
                              color: "red",
                            },
                          ]
                        : []),
                      {
                        key: "other",
                        label: "Other Price",
                        badge: "enter below",
                        color: "purple",
                      },
                    ].map((opt) => {
                      const colorMap = {
                        blue: {
                          border: "border-blue-500",
                          bg: "bg-blue-50",
                          text: "text-blue-700",
                        },
                        red: {
                          border: "border-red-500",
                          bg: "bg-red-50",
                          text: "text-red-700",
                        },
                        purple: {
                          border: "border-purple-500",
                          bg: "bg-purple-50",
                          text: "text-purple-700",
                        },
                      };
                      const c = colorMap[opt.color];
                      return (
                        <label
                          key={opt.key}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer border-2 transition-all ${priceType === opt.key ? `${c.border} ${c.bg}` : "border-gray-200"}`}
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
                            className={`flex-1 text-xs font-semibold ${priceType === opt.key ? c.text : "text-gray-700"}`}
                          >
                            {opt.label}
                          </span>
                          <span className={`text-xs font-bold ${c.text}`}>
                            {opt.badge}
                          </span>
                        </label>
                      );
                    })}
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
                      placeholder="Enter price…"
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Notes
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional note…"
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-3.5 mb-4 border border-gray-200">
                  {[
                    { label: "Unit price", value: fmt(getPrice()) },
                    { label: "Quantity", value: `× ${qty}` },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between text-xs text-gray-500 mb-1.5"
                    >
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-2">
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
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-3 text-sm font-bold transition-colors mb-2"
                  onClick={handleSell}
                  disabled={loading || !getPrice() || !!priceErr}
                >
                  {loading ? "Processing…" : `Confirm Sale — ${fmt(total)}`}
                </button>
                <button
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-semibold transition-colors"
                  onClick={() => setSelected(null)}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
