// frontend/src/pages/Totals.js
import React, { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useCurrency } from "../hooks/useCurrency";

const fmtNum = (n) => new Intl.NumberFormat().format(n || 0);

function TileRow({ label, count, amount, icon, color, fmt }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
      <div
        className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 border-l-4`}
        style={{ borderLeftColor: color }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{icon}</span>
          <div className="text-xs font-medium text-gray-500">
            {label} — Sales
          </div>
        </div>
        <div className="text-3xl font-bold" style={{ color }}>
          {fmtNum(count)}
        </div>
        <div className="text-xs text-gray-400 mt-1">items sold</div>
      </div>
      <div
        className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 border-l-4`}
        style={{ borderLeftColor: color }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">💰</span>
          <div className="text-xs font-medium text-gray-500">
            {label} — Amount
          </div>
        </div>
        <div className="text-xl font-bold" style={{ color }}>
          {fmt(amount)}
        </div>
        <div className="text-xs text-gray-400 mt-1">total revenue</div>
      </div>
    </div>
  );
}

export default function Totals() {
  const { user } = useAuth();
  const { sales } = useApp();
  const { fmt } = useCurrency();

  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDaysStr = sevenDaysAgo.toISOString().slice(0, 10);
    const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const mySales = sales.filter(
      (s) => !s.is_refunded && s.seller_id === user?.id,
    );
    const sum = (arr) =>
      arr.reduce(
        (a, s) => ({
          count: a.count + (s.quantity_sold || 0),
          amount: a.amount + s.price_sold_at * s.quantity_sold,
          txn: a.txn + 1,
        }),
        { count: 0, amount: 0, txn: 0 },
      );
    return {
      yesterday: sum(
        mySales.filter((s) => s.sale_date?.slice(0, 10) === yesterdayStr),
      ),
      week: sum(
        mySales.filter(
          (s) =>
            s.sale_date?.slice(0, 10) >= sevenDaysStr &&
            s.sale_date?.slice(0, 10) <= todayStr,
        ),
      ),
      month: sum(
        mySales.filter((s) => s.sale_date?.slice(0, 10) >= monthStart),
      ),
      today: sum(mySales.filter((s) => s.sale_date?.slice(0, 10) === todayStr)),
      yesterdayDate: yesterday.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "short",
      }),
    };
  }, [sales, user]);

  return (
    <div>
      <div className="pb-5 mb-6 border-b border-gray-200">
        <div className="text-xl sm:text-2xl font-bold text-gray-900">
          My Totals
        </div>
        <div className="text-sm text-gray-400 mt-0.5">
          Your personal sales summary · computed instantly, no data used
        </div>
      </div>

      {/* Today strip */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Transactions Today",
              value: fmtNum(stats.today.txn),
              sub: "sales recorded",
            },
            {
              label: "Items Sold Today",
              value: fmtNum(stats.today.count),
              sub: "units",
            },
            {
              label: "Today's Revenue",
              value: fmt(stats.today.amount),
              sub: "total",
            },
          ].map((tile) => (
            <div key={tile.label} className="text-center sm:text-center">
              <div className="text-[11px] text-blue-200 font-semibold uppercase tracking-wider mb-1">
                {tile.label}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mb-0.5">
                {tile.value}
              </div>
              <div className="text-xs text-blue-300">{tile.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-3">
        📅 Yesterday — {stats.yesterdayDate}
      </div>
      <TileRow
        label="Yesterday"
        count={stats.yesterday.count}
        amount={stats.yesterday.amount}
        icon="🛍️"
        color="#7c3aed"
        fmt={fmt}
      />

      <div className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-3 mt-2">
        📆 Last 7 Days
      </div>
      <TileRow
        label="Last 7 Days"
        count={stats.week.count}
        amount={stats.week.amount}
        icon="📦"
        color="#2563eb"
        fmt={fmt}
      />

      <div className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-3 mt-2">
        🗓️ Month to Date
      </div>
      <TileRow
        label="This Month"
        count={stats.month.count}
        amount={stats.month.amount}
        icon="📊"
        color="#16a34a"
        fmt={fmt}
      />
    </div>
  );
}
