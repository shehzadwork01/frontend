// frontend/src/pages/Admin.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { useCurrency } from "../hooks/useCurrency";

export default function Admin() {
  const { fmt } = useCurrency();
  const { users, addUser, toggleUserActive } = useApp();
  const [tab, setTab] = useState("users");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "seller",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [refunds, setRefunds] = useState([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [refundMsg, setRefundMsg] = useState("");
  const [refundMsgType, setRefundMsgType] = useState("success");
  const [reviewNotes, setReviewNotes] = useState({});

  const pendingCount = refunds.filter((r) => r.status === "pending").length;

  useEffect(() => {
    if (tab === "refunds") loadRefunds();
  }, [tab]);

  const loadRefunds = async () => {
    setRefundsLoading(true);
    try {
      const { data } = await axios.get("/api/sales/refund-requests");
      setRefunds(data);
    } catch {
      setRefundMsg("❌ Failed to load refund requests");
      setRefundMsgType("error");
      setTimeout(() => setRefundMsg(""), 5000);
    }
    setRefundsLoading(false);
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/sales/refund/${id}/approve`, {
        review_notes: reviewNotes[id] || "",
      });
      setRefundMsg("✅ Refund approved — stock has been restored");
      setRefundMsgType("success");
      loadRefunds();
    } catch (err) {
      setRefundMsg("❌ " + (err.response?.data?.error || "Failed"));
      setRefundMsgType("error");
    }
    setTimeout(() => setRefundMsg(""), 5000);
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`/api/sales/refund/${id}/reject`, {
        review_notes: reviewNotes[id] || "",
      });
      setRefundMsg("✅ Refund request rejected");
      setRefundMsgType("success");
      loadRefunds();
    } catch (err) {
      setRefundMsg("❌ " + (err.response?.data?.error || "Failed"));
      setRefundMsgType("error");
    }
    setTimeout(() => setRefundMsg(""), 5000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/register", form);
      addUser({ ...data, is_active: 1, created_at: new Date().toISOString() });
      setMsg("User created successfully");
      setMsgType("success");
      setShowForm(false);
      setForm({ name: "", email: "", password: "", role: "seller" });
    } catch (err) {
      setMsg(err.response?.data?.error || "Failed to create user");
      setMsgType("error");
    }
    setLoading(false);
    setTimeout(() => setMsg(""), 5000);
  };

  const handleToggle = async (id) => {
    try {
      await axios.put(`/api/auth/users/${id}/toggle`);
      toggleUserActive(id);
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    }
  };

  const roleBadge = {
    manager: "bg-amber-100 text-amber-700",
    seller: "bg-blue-100 text-blue-700",
    buyer: "bg-green-100 text-green-700",
    group: "bg-red-100 text-red-700",
  };
  const statusBadge = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-gray-200">
        <div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">
            Admin
          </div>
          <div className="text-sm text-gray-400 mt-0.5">
            Manage users &amp; refund requests
          </div>
        </div>
        {tab === "users" && (
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "✕ Cancel" : "+ Add User"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 border border-gray-200 rounded-xl p-1 w-fit">
        {[
          ["users", "👥 Users"],
          ["refunds", "🔄 Refund Requests"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {label}
            {key === "refunds" && pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <>
          {msg && (
            <div
              className={`rounded-lg px-4 py-2.5 text-sm font-medium mb-4 border ${msgType === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
            >
              {msg}
            </div>
          )}

          {showForm && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Create New User
              </h3>
              <form onSubmit={handleCreate}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {[
                    {
                      key: "name",
                      label: "Full Name *",
                      type: "text",
                      placeholder: "John Doe",
                      required: true,
                    },
                    {
                      key: "email",
                      label: "Email Address *",
                      type: "email",
                      placeholder: "john@kaduuka.com",
                      required: true,
                    },
                    {
                      key: "password",
                      label: "Password * (min 6 chars)",
                      type: "password",
                      minLength: 6,
                      required: true,
                    },
                  ].map(
                    ({
                      key,
                      label,
                      type,
                      placeholder,
                      required,
                      minLength,
                    }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          {label}
                        </label>
                        <input
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          type={type}
                          value={form[key]}
                          onChange={(e) =>
                            setForm({ ...form, [key]: e.target.value })
                          }
                          placeholder={placeholder}
                          required={required}
                          minLength={minLength}
                        />
                      </div>
                    ),
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Role *
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                    >
                      <option value="seller">Seller — can sell products</option>
                      <option value="buyer">Buyer — can add stock</option>
                      <option value="manager">Manager — full access</option>
                      <option value="group">
                        Group — owner of several shops
                      </option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-5 py-2 text-sm font-bold transition-colors"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Creating…" : "Create User"}
                  </button>
                  <button
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                    type="button"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Role permissions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              Role Permissions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                {
                  role: "Manager",
                  emoji: "👔",
                  color: "text-amber-700 bg-amber-50 border-amber-200",
                  perms: [
                    "Full dashboard",
                    "All reports",
                    "Manage users",
                    "Approve / reject refunds",
                    "Cash up / Lift",
                    "Sell products",
                  ],
                },
                {
                  role: "Seller",
                  emoji: "🛍️",
                  color: "text-blue-700 bg-blue-50 border-blue-200",
                  perms: [
                    "Sell products",
                    "Own sales log",
                    "View inventory",
                    "Request refunds",
                  ],
                },
                {
                  role: "Buyer",
                  emoji: "📦",
                  color: "text-green-700 bg-green-50 border-green-200",
                  perms: ["Add stock to inventory", "View inventory"],
                },
                {
                  role: "Group",
                  emoji: "🏢",
                  color: "text-red-700 bg-red-50 border-red-200",
                  perms: [
                    "All manager permissions",
                    "Multi-shop control",
                    "Top-level access",
                  ],
                },
              ].map(({ role, emoji, color, perms }) => (
                <div key={role} className={`rounded-xl p-3.5 border ${color}`}>
                  <div className="font-bold text-sm mb-2.5">
                    {emoji} {role}
                  </div>
                  {perms.map((p) => (
                    <div
                      key={p}
                      className="flex items-start gap-1.5 text-xs mb-1.5 opacity-80"
                    >
                      <span className="mt-0.5 shrink-0">✓</span> {p}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Users table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 font-bold text-sm text-gray-900">
              All Users ({users.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Name",
                      "Email",
                      "Role",
                      "Status",
                      "Created",
                      "Actions",
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
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-xs text-gray-500">
                        {u.email}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadge[u.role] || "bg-blue-100 text-blue-700"}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-xs text-gray-400">
                        {new Date(u.created_at).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100">
                        <button
                          onClick={() => handleToggle(u.id)}
                          className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${u.is_active ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"}`}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center text-gray-400 py-10"
                      >
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "refunds" && (
        <>
          {refundMsg && (
            <div
              className={`rounded-lg px-4 py-2.5 text-sm font-medium mb-4 border ${refundMsgType === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
            >
              {refundMsg}
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-semibold">
              {pendingCount > 0 ? (
                <span className="text-amber-600">
                  ⚠️ {pendingCount} pending request{pendingCount > 1 ? "s" : ""}{" "}
                  awaiting your review
                </span>
              ) : (
                <span className="text-green-600">
                  ✅ All caught up — no pending requests
                </span>
              )}
            </div>
            <button
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              onClick={loadRefunds}
              disabled={refundsLoading}
            >
              {refundsLoading ? "Loading…" : "↻ Refresh"}
            </button>
          </div>

          {refundsLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
              Loading refund requests…
            </div>
          ) : refunds.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
              <div className="text-4xl mb-3">🔄</div>
              <div className="font-semibold text-gray-700 mb-1">
                No refund requests yet
              </div>
              <div className="text-sm text-gray-400">
                When a seller requests a refund it will appear here
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {refunds.map((r) => (
                <div
                  key={r.id}
                  className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 border-l-4 ${r.status === "pending" ? "border-l-amber-500" : r.status === "approved" ? "border-l-green-500" : "border-l-red-500"}`}
                >
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[r.status]}`}
                        >
                          {r.status === "pending"
                            ? "⏳ Pending"
                            : r.status === "approved"
                              ? "✅ Approved"
                              : "❌ Rejected"}
                        </span>
                        <span className="text-xs text-gray-400">
                          Request #{r.id} ·{" "}
                          {new Date(r.created_at).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="font-bold text-base text-gray-900 mb-2">
                        {r.product_name}
                      </div>
                      <div className="flex gap-4 flex-wrap text-sm text-gray-500 mb-3">
                        <span>
                          👤{" "}
                          <strong className="text-gray-800">
                            {r.seller_name}
                          </strong>
                        </span>
                        <span>
                          🔢 Qty:{" "}
                          <strong className="text-gray-800">
                            {r.quantity_sold}
                          </strong>
                        </span>
                        <span>
                          💰 Sold at:{" "}
                          <strong className="text-blue-600">
                            {fmt(r.price_sold_at)}
                          </strong>
                        </span>
                        <span>
                          📅{" "}
                          <strong className="text-gray-800">
                            {new Date(r.sale_date).toLocaleDateString("en-GB")}
                          </strong>
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 mb-2">
                        <span className="text-gray-400">Reason: </span>
                        <em>{r.reason}</em>
                      </div>
                      {r.status !== "pending" && (
                        <div className="text-xs text-gray-400 mt-1">
                          Reviewed by{" "}
                          <strong>{r.reviewed_by_name || "—"}</strong>
                          {r.reviewed_at && (
                            <>
                              {" "}
                              on{" "}
                              {new Date(r.reviewed_at).toLocaleDateString(
                                "en-GB",
                              )}
                            </>
                          )}
                          {r.review_notes && (
                            <>
                              {" "}
                              · <em>"{r.review_notes}"</em>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {r.status === "pending" && (
                      <div className="flex flex-col gap-2 lg:min-w-[220px]">
                        <textarea
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
                          placeholder="Review notes (optional)…"
                          rows={2}
                          value={reviewNotes[r.id] || ""}
                          onChange={(e) =>
                            setReviewNotes((prev) => ({
                              ...prev,
                              [r.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg py-2 text-sm font-bold transition-colors"
                          onClick={() => handleApprove(r.id)}
                        >
                          ✅ Approve &amp; Restore Stock
                        </button>
                        <button
                          className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg py-2 text-xs font-semibold transition-colors"
                          onClick={() => handleReject(r.id)}
                        >
                          ❌ Reject Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
