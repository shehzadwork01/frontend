// frontend/src/pages/Inventory.js
import React, { useState, useMemo } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useCurrency } from "../hooks/useCurrency";

function compressImage(file, maxWidth = 600, quality = 0.75) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas
          .getContext("2d")
          .drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) =>
            resolve(
              new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                type: "image/jpeg",
              }),
            ),
          "image/jpeg",
          quality,
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Add New Product Modal ─────────────────────────────────────────────────────
function ProductModal({ editItem, onClose, onSaved }) {
  const { fmt } = useCurrency();
  const [form, setForm] = useState({
    name: editItem?.name || "",
    sku: editItem?.sku || "",
    purchase_price: editItem?.purchase_price || "",
    rrp: editItem?.rrp || "",
    minimum_price: editItem?.minimum_price || "",
    quantity: editItem?.quantity || "",
    category: editItem?.category || "",
    description: editItem?.description || "",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const validate = () => {
    if (!form.name) return "Product name is required";
    if (!form.purchase_price) return "Cost price is required";
    if (!form.rrp) return "Retail price is required";
    if (
      form.minimum_price &&
      Number(form.minimum_price) < Number(form.purchase_price)
    )
      return "Minimum price cannot be less than cost price";
    if (Number(form.rrp) < Number(form.purchase_price))
      return "Retail price should not be less than cost price";
    return null;
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCompressing(true);
    const compressed = await compressImage(file);
    setPhoto(compressed);
    setPhotoPreview(URL.createObjectURL(compressed));
    setCompressing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ve = validate();
    if (ve) return setErr(ve);
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v !== "" && fd.append(k, v));
    if (photo) fd.append("photo", photo);
    try {
      if (editItem) {
        await axios.put(`/api/products/${editItem.id}`, fd);
        onSaved("edit", {
          ...editItem,
          ...form,
          quantity: parseInt(form.quantity) || 0,
          minimum_price: form.minimum_price
            ? parseFloat(form.minimum_price)
            : null,
        });
      } else {
        const { data } = await axios.post("/api/products", fd);
        onSaved("add", {
          id: data.id,
          ...form,
          quantity: parseInt(form.quantity) || 0,
          minimum_price: form.minimum_price
            ? parseFloat(form.minimum_price)
            : null,
          is_active: 1,
          photo_url: null,
        });
      }
      onClose();
    } catch (err) {
      setErr(err.response?.data?.error || "Error saving product");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="text-lg font-bold text-gray-900">
            {editItem ? "✏️ Edit Product" : "➕ Add New Product"}
          </div>
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
              {err}
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
                  placeholder="e.g. Shoes…"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Photo — auto-compressed to save data
              </label>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              {compressing && (
                <div className="text-xs text-blue-600 mt-1">
                  ⚙️ Compressing…
                </div>
              )}
              {photoPreview && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="text-xs text-green-600 font-medium">
                    ✅ Compressed & ready
                  </div>
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Description
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-bold transition-colors"
              type="submit"
              disabled={saving || compressing}
            >
              {saving
                ? "Saving…"
                : editItem
                  ? "Save Changes"
                  : "Add to Inventory"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Per-item: Add Stock Modal ─────────────────────────────────────────────────
// Lets manager add new units and optionally update purchase price + minimum price
function AddStockModal({ product, onClose, onDone }) {
  const { fmt } = useCurrency();
  const [units, setUnits] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(
    product.purchase_price || "",
  );
  const [minPrice, setMinPrice] = useState(product.minimum_price || "");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const qty = parseInt(units) || 0;
  const newQty = product.quantity + qty;

  const handleSubmit = async () => {
    if (!qty || qty < 1) return setErr("Enter at least 1 unit to add");
    if (minPrice && Number(minPrice) < Number(purchasePrice))
      return setErr("Minimum price cannot be less than cost price");
    setSaving(true);
    try {
      // 1. Restock quantity
      const { data } = await axios.post(`/api/products/${product.id}/restock`, {
        units_to_add: qty,
      });

      // 2. Update prices if changed
      const priceChanged =
        String(purchasePrice) !== String(product.purchase_price) ||
        String(minPrice) !== String(product.minimum_price || "");
      if (priceChanged) {
        const fd = new FormData();
        fd.append("purchase_price", purchasePrice);
        if (minPrice !== "") fd.append("minimum_price", minPrice);
        await axios.put(`/api/products/${product.id}`, fd);
      }

      // 3. Audit log
      await axios.post("/api/stock-audit", {
        product_id: product.id,
        type: "add",
        qty_change: qty,
        reason: reason || "Restock",
        new_quantity: data.new_quantity,
      });

      onDone(product.id, qty, data.new_quantity, {
        purchase_price: parseFloat(purchasePrice),
        minimum_price: minPrice !== "" ? parseFloat(minPrice) : null,
      });
    } catch (err) {
      setErr(err.response?.data?.error || "Failed to add stock");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold text-gray-900">📦 Add Stock</div>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1 text-sm font-semibold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Product info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
          <div className="font-bold text-sm text-gray-900">{product.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            Current stock:{" "}
            <strong className="text-blue-700">{product.quantity}</strong> units
          </div>
        </div>

        {err && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm mb-3">
            {err}
          </div>
        )}

        {/* Units to add */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Units to Add *
          </label>
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            type="number"
            min="1"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            placeholder="e.g. 10"
            autoFocus
          />
        </div>

        {/* Preview */}
        {qty > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4 text-sm flex justify-between">
            <span className="text-gray-600">New stock level:</span>
            <strong className="text-green-700">
              {product.quantity} + {qty} = {newQty}
            </strong>
          </div>
        )}

        {/* Update prices */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
          <div className="text-xs font-bold text-gray-600 mb-2.5">
            💰 Update Prices (optional)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Cost Price
              </label>
              <input
                className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
                type="number"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Min Price
              </label>
              <input
                className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="text-[11px] text-gray-400 mt-1.5">
            Leave unchanged to keep current prices
          </div>
        </div>

        {/* Reason */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Reason (optional)
          </label>
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Weekly delivery…"
          />
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-bold transition-colors"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving…" : "✅ Confirm Add Stock"}
          </button>
          <button
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Per-item: Stock Take Modal ────────────────────────────────────────────────
// Manager confirms the actual counted quantity for a single product
function StockTakeModal({ product, onClose, onDone }) {
  const [counted, setCounted] = useState(product.quantity);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const diff = parseInt(counted) - product.quantity;

  const handleSubmit = async () => {
    const newQty = parseInt(counted);
    if (isNaN(newQty) || newQty < 0)
      return setErr("Enter a valid quantity (0 or more)");
    setSaving(true);
    try {
      await axios.post("/api/stock-audit/bulk", {
        changes: [
          {
            product_id: product.id,
            old_qty: product.quantity,
            new_qty: newQty,
          },
        ],
        reason: reason || "Stock take",
      });
      onDone(product.id, newQty);
    } catch (err) {
      setErr(err.response?.data?.error || "Failed to save stock take");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold text-gray-900">📋 Stock Take</div>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1 text-sm font-semibold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Product info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
          <div className="font-bold text-sm text-gray-900">{product.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            System says:{" "}
            <strong className="text-amber-700">{product.quantity}</strong> units
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800 mb-4">
          Count the actual physical stock and enter the real number below.
        </div>

        {err && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm mb-3">
            {err}
          </div>
        )}

        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Actual Count *
          </label>
          <input
            className="w-full rounded-lg border-2 border-amber-300 px-3 py-2.5 text-lg font-bold text-center outline-none focus:border-amber-500"
            type="number"
            min="0"
            value={counted}
            onChange={(e) => setCounted(e.target.value)}
            autoFocus
          />
        </div>

        {/* Diff preview */}
        <div
          className={`rounded-lg px-4 py-3 mb-4 text-sm font-semibold flex justify-between items-center border ${diff === 0 ? "bg-green-50 border-green-200 text-green-700" : diff > 0 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-red-50 border-red-200 text-red-700"}`}
        >
          <span>Change:</span>
          <span className="text-base font-extrabold">
            {diff === 0 ? "No change ✓" : `${diff > 0 ? "+" : ""}${diff} units`}
          </span>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Notes (optional)
          </label>
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Weekly audit…"
          />
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-bold transition-colors"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving
              ? "Saving…"
              : diff === 0
                ? "✅ Confirm (No Change)"
                : `✅ Confirm (${diff > 0 ? "+" : ""}${diff})`}
          </button>
          <button
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Per-item: Waste / Remove Stock Modal ──────────────────────────────────────
function WasteModal({ product, onClose, onDone }) {
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const removeQty = parseInt(qty) || 0;
  const remaining = product.quantity - removeQty;

  const handleSubmit = async () => {
    const n = parseInt(qty);
    if (!n || n < 1) return setErr("Enter at least 1 unit to remove");
    if (n > product.quantity)
      return setErr(
        `Cannot remove more than ${product.quantity} units in stock`,
      );
    setSaving(true);
    try {
      await axios.post("/api/stock-audit", {
        product_id: product.id,
        type: "waste",
        qty_change: -n,
        reason: reason || "Waste / Damage",
        new_quantity: product.quantity - n,
      });
      onDone(product.id, n);
    } catch (err) {
      setErr(err.response?.data?.error || "Failed to record waste");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold text-gray-900">
            🗑️ Remove / Waste Stock
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1 text-sm font-semibold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Product info */}
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <div className="font-bold text-sm text-gray-900">{product.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            Current stock:{" "}
            <strong className="text-red-700">{product.quantity}</strong> units
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800 mb-4">
          ⚠️ Use for damaged, expired, or lost items. This does{" "}
          <strong>not</strong> count as a sale.
        </div>

        {err && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm mb-3">
            {err}
          </div>
        )}

        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Units to Remove * (max {product.quantity})
          </label>
          <input
            className="w-full rounded-lg border-2 border-red-300 px-3 py-2.5 text-lg font-bold text-center outline-none focus:border-red-500"
            type="number"
            min="1"
            max={product.quantity}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            autoFocus
          />
        </div>

        {/* Preview */}
        {removeQty > 0 && (
          <div
            className={`rounded-lg px-4 py-3 mb-4 text-sm font-semibold flex justify-between items-center border ${remaining <= 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-gray-50 border-gray-200 text-gray-700"}`}
          >
            <span>Remaining after removal:</span>
            <span className="text-base font-extrabold">
              {product.quantity} − {removeQty} ={" "}
              <span
                className={remaining <= 0 ? "text-red-600" : "text-gray-900"}
              >
                {remaining}
              </span>
            </span>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Reason *
          </label>
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Damaged, expired, stolen…"
          />
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-bold transition-colors"
            onClick={handleSubmit}
            disabled={saving || !removeQty || remaining < 0}
          >
            {saving
              ? "Saving…"
              : `🗑️ Remove ${removeQty || ""} Unit${removeQty !== 1 ? "s" : ""}`}
          </button>
          <button
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Per-item: Action Menu (portal dropdown — escapes overflow:hidden) ─────────
function ItemActionMenu({ product, onAction }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = React.useRef(null);

  const actions = [
    { key: "addstock", icon: "📦", label: "Add Stock", color: "text-blue-700" },
    {
      key: "stocktake",
      icon: "📋",
      label: "Stock Take",
      color: "text-amber-700",
    },
    {
      key: "waste",
      icon: "🗑️",
      label: "Waste / Remove",
      color: "text-red-600",
    },
    { key: "edit", icon: "✏️", label: "Edit Details", color: "text-gray-700" },
    {
      key: "delete",
      icon: "❌",
      label: "Delete Product",
      color: "text-red-700",
    },
  ];

  const handleOpen = () => {
    const rect = btnRef.current.getBoundingClientRect();
    // Position menu below the button, aligned to its right edge
    setMenuPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - 176, // 176 = w-44
    });
    setOpen(true);
  };

  const menu = open
    ? ReactDOM.createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: menuPos.top,
              left: menuPos.left,
              zIndex: 9999,
            }}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl w-44 py-1 overflow-hidden"
          >
            {actions.map((a) => (
              <button
                key={a.key}
                onClick={() => {
                  setOpen(false);
                  onAction(a.key, product);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold hover:bg-gray-50 transition-colors text-left ${a.color}`}
              >
                <span>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1"
      >
        Actions <span className="text-[10px]">▾</span>
      </button>
      {menu}
    </div>
  );
}

// ── Popular Products sidebar widget ──────────────────────────────────────────
function PopularProducts({ products, sales, fmt }) {
  const popular = useMemo(() => {
    const counts = {};
    sales
      .filter((s) => !s.is_refunded)
      .forEach((s) => {
        counts[s.product_id] = (counts[s.product_id] || 0) + s.quantity_sold;
      });
    return products
      .map((p) => ({ ...p, sold: counts[p.id] || 0 }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 6);
  }, [products, sales]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 font-bold text-sm bg-gray-50">
        🏆 Popular Products
      </div>
      <div className="p-3">
        {popular.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-4">
            No sales data yet
          </div>
        ) : (
          popular.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-2.5 py-2 ${i < popular.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-400 text-white" : i === 2 ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-500"}`}
              >
                {i + 1}
              </div>
              {p.photo_url ? (
                <img
                  src={p.photo_url}
                  alt=""
                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base shrink-0">
                  📦
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">
                  {p.name}
                </div>
                <div className="text-xs text-gray-400">
                  {p.sold} sold · {p.quantity} left
                </div>
              </div>
              <div className="text-xs font-bold text-blue-600 shrink-0">
                {fmt(p.rrp)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Inventory Page ───────────────────────────────────────────────────────
export default function Inventory() {
  const { can } = useAuth();
  const { products, sales, addProduct, updateProduct, removeProduct } =
    useApp();
  const { fmt } = useCurrency();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'addstock' | 'stocktake' | 'waste'
  const [activeProduct, setActiveProduct] = useState(null);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");

  const showMsg = (text, type = "success") => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(""), 4000);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase()),
  );
  const totalItems = products.reduce((a, p) => a + p.quantity, 0);

  const handleSaved = (mode, product) => {
    if (mode === "add") {
      addProduct(product);
      showMsg("✅ Product added");
    } else {
      updateProduct(product.id, product);
      showMsg("✅ Product updated");
    }
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this product from inventory?")) return;
    await axios.delete(`/api/products/${id}`);
    removeProduct(id);
    showMsg("✅ Product removed");
  };

  // Unified action handler from the per-row dropdown
  const handleAction = (action, product) => {
    if (action === "delete") {
      handleDelete(product.id);
      return;
    }
    setActiveProduct(product);
    setModal(action); // 'edit' | 'addstock' | 'stocktake' | 'waste'
  };

  const closeModal = () => {
    setModal(null);
    setActiveProduct(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-gray-200">
        <div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">
            Inventory
          </div>
          <div className="text-sm text-gray-400 mt-0.5">
            {products.length} products · {totalItems.toLocaleString()} items in
            stock
          </div>
        </div>
        {can("manager", "group") && (
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors"
            onClick={() => {
              setActiveProduct(null);
              setModal("add");
            }}
          >
            ➕ Add New Product
          </button>
        )}
      </div>

      {msg && (
        <div
          className={`rounded-lg px-4 py-2.5 text-sm font-medium mb-4 border ${msgType === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
        >
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4 items-start">
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4">
            <input
              className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
              placeholder="🔍 Search by name, SKU or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200">
                      Product
                    </th>
                    <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200">
                      Category
                    </th>
                    {can("manager", "group") && (
                      <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200">
                        Cost
                      </th>
                    )}
                    <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200">
                      Retail
                    </th>
                    <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200">
                      Min Price
                    </th>
                    <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200">
                      Stock
                    </th>
                    {can("manager", "group") && (
                      <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200">
                        Value
                      </th>
                    )}
                    {can("manager", "group") && (
                      <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          {p.photo_url ? (
                            <img
                              src={p.photo_url}
                              alt=""
                              className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg shrink-0">
                              📦
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">
                              {p.name}
                            </div>
                            {p.sku && (
                              <div className="text-xs text-gray-400">
                                {p.sku}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100">
                        <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                          {p.category || "General"}
                        </span>
                      </td>
                      {can("manager", "group") && (
                        <td className="px-4 py-3 border-b border-gray-100 font-mono text-xs text-gray-600">
                          {fmt(p.purchase_price)}
                        </td>
                      )}
                      <td className="px-4 py-3 border-b border-gray-100 font-mono text-xs font-semibold text-blue-600">
                        {fmt(p.rrp)}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 font-mono text-xs">
                        {p.minimum_price ? (
                          <span className="text-red-600 font-semibold">
                            {fmt(p.minimum_price)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100">
                        <span
                          className={`font-bold text-sm ${p.quantity === 0 ? "text-red-600" : p.quantity < 5 ? "text-amber-600" : "text-green-600"}`}
                        >
                          {p.quantity === 0 ? "⚠️ Out" : p.quantity}
                        </span>
                      </td>
                      {can("manager", "group") && (
                        <td className="px-4 py-3 border-b border-gray-100 font-mono text-xs text-gray-600">
                          {fmt(p.quantity * p.purchase_price)}
                        </td>
                      )}
                      {can("manager", "group") && (
                        <td className="px-4 py-3 border-b border-gray-100">
                          <ItemActionMenu product={p} onAction={handleAction} />
                        </td>
                      )}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan="8"
                        className="text-center text-gray-400 py-12 text-sm"
                      >
                        {search
                          ? `No products matching "${search}"`
                          : "No products in inventory"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="xl:sticky xl:top-6">
          <PopularProducts products={products} sales={sales} fmt={fmt} />
        </div>
      </div>

      {/* ── Modals ── */}
      {(modal === "add" || modal === "edit") && (
        <ProductModal
          editItem={modal === "edit" ? activeProduct : null}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {modal === "addstock" && activeProduct && (
        <AddStockModal
          product={activeProduct}
          onClose={closeModal}
          onDone={(pid, qty, newQty, priceUpdates) => {
            updateProduct(pid, {
              ...activeProduct,
              quantity: newQty,
              ...priceUpdates,
            });
            showMsg(`✅ Added ${qty} units — new stock: ${newQty}`);
            closeModal();
          }}
        />
      )}

      {modal === "stocktake" && activeProduct && (
        <StockTakeModal
          product={activeProduct}
          onClose={closeModal}
          onDone={(pid, newQty) => {
            const diff = newQty - activeProduct.quantity;
            updateProduct(pid, { ...activeProduct, quantity: newQty });
            showMsg(
              diff === 0
                ? "✅ Stock take confirmed — no changes"
                : `✅ Stock take saved — ${diff > 0 ? "+" : ""}${diff} units`,
            );
            closeModal();
          }}
        />
      )}

      {modal === "waste" && activeProduct && (
        <WasteModal
          product={activeProduct}
          onClose={closeModal}
          onDone={(pid, qty) => {
            updateProduct(pid, {
              ...activeProduct,
              quantity: activeProduct.quantity - qty,
            });
            showMsg(`✅ ${qty} unit${qty > 1 ? "s" : ""} removed & logged`);
            closeModal();
          }}
        />
      )}
    </div>
  );
}
