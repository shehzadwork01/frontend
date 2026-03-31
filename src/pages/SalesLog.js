// frontend/src/pages/SalesLog.js
import React, { useState, useMemo, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useCurrency } from "../hooks/useCurrency";

const LIMIT = 50;

function RefundModal({ sale, onClose, onSubmit }) {
  const { fmt } = useCurrency();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleSubmit = async () => {
    if (!reason.trim()) return setErr("Please enter a reason for the refund.");
    setLoading(true);
    setErr("");
    try {
      await onSubmit(sale.id, reason.trim());
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to submit refund request.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold text-gray-900">
            🔄 Request Refund
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1 text-sm font-semibold transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 mb-4">
          <div className="font-bold text-base text-gray-900 mb-1.5">
            {sale.product_name}
          </div>
          <div className="flex gap-4 flex-wrap text-sm text-gray-500">
            <span>
              🔢 Qty:{" "}
              <strong className="text-gray-800">{sale.quantity_sold}</strong>
            </span>
            <span>
              💰 Sold at:{" "}
              <strong className="text-blue-600">
                {fmt(sale.price_sold_at)}
              </strong>
            </span>
            <span>
              💵 Total:{" "}
              <strong className="text-blue-600">
                {fmt(sale.price_sold_at * sale.quantity_sold)}
              </strong>
            </span>
            <span>
              📅{" "}
              <strong className="text-gray-800">
                {new Date(sale.sale_date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
            </span>
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Reason for Refund <span className="text-red-500">*</span>
          </label>
          <textarea
            ref={textareaRef}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-y"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (err) setErr("");
            }}
            placeholder="e.g. Customer returned item — wrong size, product was damaged…"
          />
          {err && (
            <div className="text-xs text-red-600 mt-1 font-semibold">
              ❌ {err}
            </div>
          )}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 mb-4">
          ⚠️ This request will be sent to your manager for approval. Stock will
          only be restored once approved.
        </div>
        <div className="flex gap-3">
          <button
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-bold transition-colors"
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
          >
            {loading ? "Submitting…" : "Submit Refund Request"}
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

export default function SalesLog() {
  const { can, user } = useAuth();
  const { sales } = useApp();
  const { fmt } = useCurrency();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [filterMode, setFilterMode] = useState("date");
  const [msg, setMsg] = useState("");
  const [refundSale, setRefundSale] = useState(null);

  const filtered = useMemo(() => {
    let result = [...sales].sort(
      (a, b) => new Date(b.sale_date) - new Date(a.sale_date),
    );
    if (!can("manager", "group"))
      result = result.filter((s) => s.seller_id === user?.id);
    if (filterMode === "date") {
      if (from)
        result = result.filter((s) => s.sale_date?.slice(0, 10) >= from);
      if (to) result = result.filter((s) => s.sale_date?.slice(0, 10) <= to);
    } else if (productSearch.trim()) {
      result = result.filter((s) =>
        (s.product_name || "")
          .toLowerCase()
          .includes(productSearch.toLowerCase()),
      );
    }
    return result.slice(0, LIMIT);
  }, [sales, from, to, productSearch, filterMode, user, can]);

  const totalRevenue = filtered.reduce(
    (a, s) => a + s.price_sold_at * s.quantity_sold,
    0,
  );
  const totalProfit = filtered.reduce((a, s) => a + (Number(s.profit) || 0), 0);

  const handleRefundSubmit = async (saleId, reason) => {
    await axios.post(`/api/sales/${saleId}/refund-request`, { reason });
    setMsg("✅ Refund request submitted for manager approval");
    setTimeout(() => setMsg(""), 5000);
  };

  return (
    <div>
      <div className="pb-5 mb-6 border-b border-gray-200">
        <div className="text-xl sm:text-2xl font-bold text-gray-900">
          Sales Log
        </div>
        <div className="text-sm text-gray-400 mt-0.5">
          Showing {filtered.length} of {sales.length} transactions (newest
          first)
        </div>
      </div>

      {msg && (
        <div
          className={`rounded-lg px-4 py-2.5 text-sm font-medium mb-4 border ${msg.startsWith("✅") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
        >
          {msg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5">
        <div className="flex gap-2 mb-3 flex-wrap">
          <button
            onClick={() => setFilterMode("date")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${filterMode === "date" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
          >
            📅 Filter by Date
          </button>
          <button
            onClick={() => setFilterMode("product")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${filterMode === "product" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
          >
            📦 Filter by Product
          </button>
          {(from || to || productSearch) && (
            <button
              onClick={() => {
                setFrom("");
                setTo("");
                setProductSearch("");
              }}
              className="ml-auto bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              ✕ Clear
            </button>
          )}
        </div>
        {filterMode === "date" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                From Date
              </label>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                To Date
              </label>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Search Product Name
            </label>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="e.g. Sugar, Bread…"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              autoFocus
            />
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-xs font-medium text-gray-500 mb-1">
              Total Revenue
            </div>
            <div className="text-xl font-bold text-gray-900">
              {fmt(totalRevenue)}
            </div>
          </div>
          {can("manager", "group") && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="text-2xl mb-2">📈</div>
              <div className="text-xs font-medium text-gray-500 mb-1">
                Total Profit
              </div>
              <div className="text-xl font-bold text-green-600">
                {fmt(totalProfit)}
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="text-2xl mb-2">🛍️</div>
            <div className="text-xs font-medium text-gray-500 mb-1">
              Transactions
            </div>
            <div className="text-xl font-bold text-gray-900">
              {filtered.length}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200 whitespace-nowrap">
                  Date &amp; Time
                </th>
                <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200">
                  Product
                </th>
                {can("manager", "group") && (
                  <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200">
                    Seller
                  </th>
                )}
                <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200">
                  Qty
                </th>
                <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200 whitespace-nowrap">
                  Unit Price
                </th>
                <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200">
                  Total
                </th>
                {can("manager", "group") && (
                  <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200">
                    Profit
                  </th>
                )}
                <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200 whitespace-nowrap">
                  Price Type
                </th>
                <th className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200">
                  Status
                </th>
                <th className="px-4 py-3 border-b border-gray-200"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className={`hover:bg-gray-50 transition-colors ${s.is_refunded ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3 border-b border-gray-100 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(s.sale_date).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">
                    {s.product_name}
                  </td>
                  {can("manager", "group") && (
                    <td className="px-4 py-3 border-b border-gray-100 text-xs text-gray-500">
                      {s.seller_name}
                    </td>
                  )}
                  <td className="px-4 py-3 border-b border-gray-100 text-center text-gray-600">
                    {s.quantity_sold}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 font-mono text-xs text-gray-600">
                    {fmt(s.price_sold_at)}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 font-mono text-xs font-bold text-gray-900">
                    {fmt(s.price_sold_at * s.quantity_sold)}
                  </td>
                  {can("manager", "group") && (
                    <td className="px-4 py-3 border-b border-gray-100 font-mono text-xs text-green-600">
                      {fmt(s.profit)}
                    </td>
                  )}
                  <td className="px-4 py-3 border-b border-gray-100">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.price_type === "rrp" ? "bg-blue-100 text-blue-700" : s.price_type === "minimum" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}
                    >
                      {s.price_type === "rrp"
                        ? "RRP"
                        : s.price_type === "minimum"
                          ? "Min Price"
                          : "Custom"}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100">
                    {s.is_refunded ? (
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700">
                        Refunded
                      </span>
                    ) : (
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700">
                        Sold
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100">
                    {!s.is_refunded && (
                      <button
                        className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors"
                        onClick={() => setRefundSale(s)}
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center text-gray-400 py-12">
                    No sales found
                    {from || to
                      ? " for this date range"
                      : productSearch
                        ? ` matching "${productSearch}"`
                        : ""}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length === LIMIT && (
          <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100 text-center">
            Showing {LIMIT} most recent entries. Use date or product filter to
            narrow down.
          </div>
        )}
      </div>

      {refundSale && (
        <RefundModal
          sale={refundSale}
          onClose={() => setRefundSale(null)}
          onSubmit={handleRefundSubmit}
        />
      )}
    </div>
  );
}
