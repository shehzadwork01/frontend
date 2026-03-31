// frontend/src/components/Sidebar.js
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ open, onClose }) {
  const { user, can, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    const slug = user?.shop_slug;
    logout();
    onClose?.();
    if (slug) navigate(`/shop/${slug}`);
    else navigate("/login");
  };

  const isSeller = user?.role === "seller";

  const linkClass = ({ isActive }) =>
    [
      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-all duration-150 cursor-pointer",
      isActive
        ? "bg-white/15 text-white border-l-[3px] border-blue-400"
        : "text-gray-400 hover:text-white hover:bg-white/[0.06] border-l-[3px] border-transparent",
    ].join(" ");

  const navItems = (
    <nav className="flex-1 px-3 py-2 overflow-y-auto">
      <div className="px-2 pt-3 pb-1 text-[10px] uppercase font-semibold tracking-widest text-gray-600">
        Main
      </div>

      <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
        <span>🏠</span> Dashboard
      </NavLink>

      {!isSeller && (
        <NavLink to="/inventory" className={linkClass} onClick={onClose}>
          <span>📦</span> Inventory
        </NavLink>
      )}

      {can("seller", "manager", "group") && (
        <NavLink to="/sell" className={linkClass} onClick={onClose}>
          <span>🛍️</span> Sell Product
        </NavLink>
      )}

      <NavLink to="/sales-log" className={linkClass} onClick={onClose}>
        <span>📋</span> Sales Log
      </NavLink>

      {isSeller && (
        <NavLink to="/totals" className={linkClass} onClick={onClose}>
          <span>📊</span> Totals
        </NavLink>
      )}

      {!isSeller && (
        <>
          <div className="px-2 pt-4 pb-1 text-[10px] uppercase font-semibold tracking-widest text-gray-600 mt-1">
            Management
          </div>
          {can("manager", "group") && (
            <NavLink to="/reports" className={linkClass} onClick={onClose}>
              <span>📈</span> Reports
            </NavLink>
          )}
          {can("manager", "group") && (
            <NavLink to="/admin" className={linkClass} onClick={onClose}>
              <span>⚙️</span> Admin
            </NavLink>
          )}
          {can("manager", "group") && (
            <NavLink to="/cash-up" className={linkClass} onClick={onClose}>
              <span>💰</span> Lift / Cash Up
            </NavLink>
          )}
        </>
      )}
    </nav>
  );

  const userFooter = (
    <div className="px-3 py-3 border-t border-white/10">
      {user?.shop_name && (
        <div className="mb-3 bg-white/10 border border-white/20 rounded-lg px-3 py-2">
          <div className="text-[9px] text-white/40 uppercase tracking-widest mb-0.5">
            Current Shop
          </div>
          <div className="text-sm font-bold text-white truncate">
            {user.shop_name}
          </div>
          {user?.shop_slug && (
            <div className="text-[10px] text-white/30 font-mono mt-0.5 truncate">
              /shop/{user.shop_slug.slice(0, 12)}…
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {user?.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">
            {user?.name}
          </div>
          <div className="text-[11px] text-blue-400 font-semibold capitalize">
            {user?.role}
          </div>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-red-300 hover:bg-red-500/20 transition-all duration-150 cursor-pointer border-0 bg-transparent"
      >
        <span>🚪</span> Log Out
      </button>
    </div>
  );

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/10">
        <span className="text-2xl">🏪</span>
        <div className="font-extrabold text-white text-base tracking-tight">
          Kaduuka
        </div>
        {/* Close button on mobile */}
        <button
          onClick={onClose}
          className="ml-auto lg:hidden text-gray-400 hover:text-white p-1 rounded transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      {navItems}
      {userFooter}
    </>
  );

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-[230px] bg-gray-900 border-r border-gray-800 z-50">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile/tablet floating sidebar */}
      <aside
        className={[
          "fixed top-0 left-0 h-screen w-[230px] bg-gray-900 border-r border-gray-800 z-50 flex flex-col transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
