// frontend/src/pages/Reports.js
import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useCurrency } from "../hooks/useCurrency";

const fmtNum = (n) => new Intl.NumberFormat().format(n || 0);

const PRESETS = [
  {
    label: "Today",
    getDates: () => {
      const d = new Date().toISOString().slice(0, 10);
      return [d, d];
    },
  },
  {
    label: "Yesterday",
    getDates: () => {
      const d = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      return [d, d];
    },
  },
  {
    label: "Last 7 Days",
    getDates: () => [
      new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
      new Date().toISOString().slice(0, 10),
    ],
  },
  {
    label: "This Month",
    getDates: () => {
      const n = new Date();
      return [
        `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-01`,
        n.toISOString().slice(0, 10),
      ];
    },
  },
];

function downloadCSV(filename, headers, rows) {
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { sales, products, users } = useApp();
  const { fmt, currency } = useCurrency();
  const [tab, setTab] = useState("sales");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const setPreset = (p) => {
    const [f, t] = p.getDates();
    setFrom(f);
    setTo(t);
  };

  const salesData = useMemo(() => {
    const active = sales.filter((s) => {
      if (s.is_refunded) return false;
      const d = s.sale_date?.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
    const byDate = {};
    active.forEach((s) => {
      const d = s.sale_date?.slice(0, 10);
      if (!byDate[d])
        byDate[d] = {
          date: d,
          transactions: 0,
          items_sold: 0,
          revenue: 0,
          profit: 0,
        };
      byDate[d].transactions++;
      byDate[d].items_sold += s.quantity_sold;
      byDate[d].revenue += s.price_sold_at * s.quantity_sold;
      byDate[d].profit += Number(s.profit) || 0;
    });
    return Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
  }, [sales, from, to]);

  const stockData = useMemo(
    () =>
      [...products]
        .sort((a, b) => a.quantity - b.quantity)
        .map((p) => ({ ...p, stock_value: p.quantity * p.purchase_price })),
    [products],
  );

  const empData = useMemo(() => {
    const active = sales.filter((s) => {
      if (s.is_refunded) return false;
      const d = s.sale_date?.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
    const byUser = {};
    active.forEach((s) => {
      if (!byUser[s.seller_id])
        byUser[s.seller_id] = {
          id: s.seller_id,
          name: s.seller_name,
          role: "seller",
          transactions: 0,
          items_sold: 0,
          revenue: 0,
          profit: 0,
        };
      byUser[s.seller_id].transactions++;
      byUser[s.seller_id].items_sold += s.quantity_sold;
      byUser[s.seller_id].revenue += s.price_sold_at * s.quantity_sold;
      byUser[s.seller_id].profit += Number(s.profit) || 0;
    });
    users
      .filter((u) => ["seller", "manager"].includes(u.role))
      .forEach((u) => {
        if (!byUser[u.id])
          byUser[u.id] = {
            id: u.id,
            name: u.name,
            role: u.role,
            transactions: 0,
            items_sold: 0,
            revenue: 0,
            profit: 0,
          };
      });
    return Object.values(byUser).sort((a, b) => b.revenue - a.revenue);
  }, [sales, users, from, to]);

  const totals = {
    rev: salesData.reduce((a, d) => a + d.revenue, 0),
    prof: salesData.reduce((a, d) => a + d.profit, 0),
    items: salesData.reduce((a, d) => a + d.items_sold, 0),
  };

  return (
    <div>
      <div className="pb-5 mb-6 border-b border-gray-200">
        <div className="text-xl sm:text-2xl font-bold text-gray-900">
          Reports
        </div>
        <div className="text-sm text-gray-400 mt-0.5">
          Computed from cached data — no internet needed
        </div>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 border border-gray-200 rounded-xl p-1 w-fit flex-wrap">
        {[
          ["sales", "📊 Sales"],
          ["stock", "📦 Stock"],
          ["employees", "👥 Employees"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab !== "stock" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5">
          <div className="flex gap-2 flex-wrap mb-3">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setPreset(p)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                {p.label}
              </button>
            ))}
            {(from || to) && (
              <button
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
                className="ml-auto text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                ✕ Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                From
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
                To
              </label>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            ⚡ Filtering {sales.length} cached transactions — no internet used
          </div>
        </div>
      )}

      {tab === "sales" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {[
              {
                label: "Items Sold",
                value: fmtNum(totals.items),
                icon: "🛍️",
                color: "purple",
              },
              {
                label: "Total Revenue",
                value: fmt(totals.rev),
                icon: "💰",
                color: "blue",
              },
              {
                label: "Total Profit",
                value: fmt(totals.prof),
                icon: "📈",
                color: "green",
              },
            ].map((c) => (
              <div
                key={c.label}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
              >
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className="text-xs font-medium text-gray-500 mb-1">
                  {c.label}
                </div>
                <div
                  className={`text-xl font-bold ${c.color === "purple" ? "text-purple-600" : c.color === "blue" ? "text-blue-600" : "text-green-600"}`}
                >
                  {c.value}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="font-bold text-sm text-gray-900">
                Daily Breakdown
              </div>
              <button
                onClick={() =>
                  downloadCSV(
                    `sales-report-${from || "all"}-to-${to || "today"}.csv`,
                    [
                      "Date",
                      "Transactions",
                      "Items Sold",
                      `Revenue (${currency})`,
                      `Profit (${currency})`,
                    ],
                    salesData.map((d) => [
                      d.date,
                      d.transactions,
                      d.items_sold,
                      d.revenue.toFixed(0),
                      d.profit.toFixed(0),
                    ]),
                  )
                }
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                ⬇️ Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Date",
                      "Transactions",
                      "Items",
                      "Revenue",
                      "Profit",
                      "Margin",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((d) => (
                    <tr
                      key={d.date}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">
                        {d.date}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-600">
                        {d.transactions}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-600">
                        {fmtNum(d.items_sold)}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 font-mono text-xs font-semibold text-blue-600">
                        {fmt(d.revenue)}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 font-mono text-xs text-green-600">
                        {fmt(d.profit)}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-xs text-gray-400">
                        {d.revenue > 0
                          ? ((d.profit / d.revenue) * 100).toFixed(1) + "%"
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {salesData.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center text-gray-400 py-10"
                      >
                        No sales in this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "stock" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-2">
            <div>
              <div className="font-bold text-sm text-gray-900">
                Stock Levels
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Total value:{" "}
                <strong className="text-blue-600">
                  {fmt(stockData.reduce((a, d) => a + d.stock_value, 0))}
                </strong>{" "}
                · {stockData.reduce((a, d) => a + d.quantity, 0)} items across{" "}
                {stockData.length} products
              </div>
            </div>
            <button
              onClick={() =>
                downloadCSV(
                  "stock-report.csv",
                  [
                    "Product",
                    "SKU",
                    "Category",
                    "Quantity",
                    `Cost Price (${currency})`,
                    `Retail Price (${currency})`,
                    `Stock Value (${currency})`,
                  ],
                  stockData.map((p) => [
                    p.name,
                    p.sku || "",
                    p.category || "",
                    p.quantity,
                    p.purchase_price,
                    p.rrp,
                    p.stock_value.toFixed(0),
                  ]),
                )
              }
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              ⬇️ Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Product",
                    "SKU",
                    "Category",
                    "Qty",
                    "Cost Price",
                    "Retail Price",
                    "Stock Value",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stockData.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">
                      {p.name}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-xs text-gray-400">
                      {p.sku || "—"}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100">
                      <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        {p.category || "General"}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100">
                      <span
                        className={`font-bold text-sm ${p.quantity === 0 ? "text-red-600" : p.quantity < 5 ? "text-amber-600" : "text-green-600"}`}
                      >
                        {p.quantity === 0 ? "⚠️ Out" : fmtNum(p.quantity)}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 font-mono text-xs text-gray-600">
                      {fmt(p.purchase_price)}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 font-mono text-xs text-gray-600">
                      {fmt(p.rrp)}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 font-mono text-xs font-semibold text-gray-800">
                      {fmt(p.stock_value)}
                    </td>
                  </tr>
                ))}
                {stockData.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-gray-400 py-10">
                      No products in inventory
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "employees" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="font-bold text-sm text-gray-900">
              Employee Performance
            </div>
            <button
              onClick={() =>
                downloadCSV(
                  `employee-report-${from || "all"}.csv`,
                  [
                    "Employee",
                    "Role",
                    "Transactions",
                    "Items Sold",
                    `Revenue (${currency})`,
                    `Profit (${currency})`,
                  ],
                  empData.map((e) => [
                    e.name,
                    e.role,
                    e.transactions,
                    e.items_sold,
                    e.revenue.toFixed(0),
                    e.profit.toFixed(0),
                  ]),
                )
              }
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              ⬇️ Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Employee",
                    "Role",
                    "Transactions",
                    "Items Sold",
                    "Revenue",
                    "Profit",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-200"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empData.map((e, i) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        {i === 0 && <span>🏆</span>}
                        <span className="font-semibold text-gray-900">
                          {e.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${e.role === "manager" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {e.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-600">
                      {fmtNum(e.transactions)}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-600">
                      {fmtNum(e.items_sold)}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 font-mono text-xs font-semibold text-blue-600">
                      {fmt(e.revenue)}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 font-mono text-xs text-green-600">
                      {fmt(e.profit)}
                    </td>
                  </tr>
                ))}
                {empData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-gray-400 py-10">
                      No employee data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
