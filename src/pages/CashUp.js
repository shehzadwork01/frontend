// frontend/src/pages/CashUp.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useCurrency } from "../hooks/useCurrency";

export default function CashUp() {
  const { fmt, currency } = useCurrency();
  const [form, setForm] = useState({
    opening_float: "",
    actual_cash: "",
    seller_id: "",
    session_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [sellers, setSellers] = useState([]);
  const [dayRevenue, setDayRevenue] = useState(0);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");

  useEffect(() => {
    axios
      .get("/api/auth/users")
      .then((r) =>
        setSellers(
          r.data.filter((u) => ["seller", "manager"].includes(u.role)),
        ),
      )
      .catch(() => {});
    const today = new Date().toISOString().slice(0, 10);
    axios
      .get(`/api/reports/sales?from=${today}&to=${today}`)
      .then((r) =>
        setDayRevenue(r.data.reduce((a, d) => a + Number(d.revenue), 0)),
      )
      .catch(() => {});
  }, []);

  const openingFloat = parseFloat(form.opening_float) || 0;
  const actualCash = parseFloat(form.actual_cash) || 0;
  const expectedCash = openingFloat + dayRevenue;
  const variance = actualCash - expectedCash;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/cash-up", {
        ...form,
        opening_float: openingFloat,
        expected_cash: expectedCash,
        actual_cash: actualCash,
      });
      setMsg("✅ Cash up session saved successfully!");
      setMsgType("success");
      setForm({
        opening_float: "",
        actual_cash: "",
        seller_id: "",
        session_date: new Date().toISOString().slice(0, 10),
        notes: "",
      });
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.error || "Failed to save cash up"));
      setMsgType("error");
    }
    setTimeout(() => setMsg(""), 5000);
  };

  return (
    <div>
      <div className="pb-5 mb-6 border-b border-gray-200">
        <div className="text-xl sm:text-2xl font-bold text-gray-900">
          Lift / Cash Up
        </div>
        <div className="text-sm text-gray-400 mt-0.5">
          End-of-day cash reconciliation
        </div>
      </div>

      {msg && (
        <div
          className={`rounded-lg px-4 py-2.5 text-sm font-medium mb-4 border ${msgType === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
        >
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-bold text-gray-900 mb-5">
            New Cash Up Session
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Session Date
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  type="date"
                  value={form.session_date}
                  onChange={(e) =>
                    setForm({ ...form, session_date: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Seller (optional)
                </label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                  value={form.seller_id}
                  onChange={(e) =>
                    setForm({ ...form, seller_id: e.target.value })
                  }
                >
                  <option value="">All sellers</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Opening Float ({currency})
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  type="number"
                  value={form.opening_float}
                  onChange={(e) =>
                    setForm({ ...form, opening_float: e.target.value })
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Actual Cash in Till ({currency})
                </label>
                <input
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  type="number"
                  value={form.actual_cash}
                  onChange={(e) =>
                    setForm({ ...form, actual_cash: e.target.value })
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Notes
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any discrepancies or comments..."
                rows={3}
              />
            </div>
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 text-sm font-bold transition-colors"
              type="submit"
            >
              Save Cash Up Session
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              📊 Today's Summary
            </h3>
            <div className="flex flex-col gap-3">
              {[
                {
                  label: "Today's Revenue",
                  value: fmt(dayRevenue),
                  color: "text-blue-600",
                },
                {
                  label: "Opening Float",
                  value: fmt(openingFloat),
                  color: "text-gray-600",
                },
                {
                  label: "Expected in Till",
                  value: fmt(expectedCash),
                  color: "text-purple-600",
                  bold: true,
                },
                {
                  label: "Actual Cash",
                  value: fmt(actualCash),
                  color: "text-gray-700",
                },
              ].map(({ label, value, color, bold }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span
                    className={`${bold ? "font-bold" : "font-semibold"} ${color}`}
                  >
                    {value}
                  </span>
                </div>
              ))}
              <div className="border-t-2 border-gray-200 pt-3 flex justify-between text-base font-bold">
                <span>Variance</span>
                <span
                  className={
                    variance === 0
                      ? "text-green-600"
                      : variance > 0
                        ? "text-blue-600"
                        : "text-red-600"
                  }
                >
                  {variance >= 0 ? "+" : ""}
                  {fmt(variance)}
                </span>
              </div>
            </div>
            {form.actual_cash !== "" && (
              <div
                className={`rounded-lg px-3 py-2.5 text-sm font-medium mt-4 border ${variance === 0 ? "bg-green-50 text-green-700 border-green-200" : variance > 0 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-red-50 text-red-700 border-red-200"}`}
              >
                {variance === 0 && "✅ Cash balanced perfectly!"}
                {variance > 0 &&
                  `ℹ️ Till is over by ${fmt(Math.abs(variance))}`}
                {variance < 0 &&
                  `⚠️ Till is short by ${fmt(Math.abs(variance))}`}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-sm text-gray-500">
            <div className="font-bold text-gray-900 mb-3">
              💡 How to Cash Up
            </div>
            <ol className="flex flex-col gap-2">
              {[
                "Count all cash in the till",
                "Enter the opening float (the starting cash)",
                "Enter actual cash counted",
                "System calculates the variance automatically",
                "Save the session for records",
              ].map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-blue-600 font-bold shrink-0">
                    {i + 1}.
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
