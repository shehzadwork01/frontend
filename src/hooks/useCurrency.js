// frontend/src/hooks/useCurrency.js
// Returns a fmt() function that uses the shop's actual currency code.
// Falls back to UGX if no currency is set (most common for the target market).
import { useAuth } from "../context/AuthContext";

// Currency symbol map for common African currencies
const CURRENCY_SYMBOLS = {
  UGX: "UGX ",
  KES: "KSh ",
  TZS: "TSh ",
  RWF: "RF ",
  USD: "$",
  GBP: "£",
  EUR: "€",
  ZAR: "R ",
  NGN: "₦",
  GHS: "GH₵",
  ETB: "Br ",
  ZMW: "K ",
};

export function useCurrency() {
  const { user } = useAuth();
  // shop_currency comes from the JWT token → user object
  const currency = user?.shop_currency || "UGX";

  const fmt = (n) => {
    const num = Number(n) || 0;
    // Use Intl if the currency is ISO-supported, else manual prefix
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0, // No decimals for African currencies
        minimumFractionDigits: 0,
      }).format(num);
    } catch {
      // Fallback for unsupported codes
      const sym = CURRENCY_SYMBOLS[currency] || currency + " ";
      return sym + new Intl.NumberFormat("en-US").format(num);
    }
  };

  return { fmt, currency };
}
