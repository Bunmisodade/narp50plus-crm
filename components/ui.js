"use client";
import { useEffect } from "react";

export function Button({ variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-forest text-white hover:bg-forest-dark",
    ghost: "border border-line-strong text-ink bg-transparent hover:border-forest hover:text-forest-dark",
    subtle: "border border-line-strong text-ink bg-white hover:border-forest-dark",
    danger: "bg-rust text-white hover:opacity-90",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-card font-sans font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function IconButton({ className = "", ...props }) {
  return (
    <button
      aria-label="Close"
      className={`w-7 h-7 rounded-full border border-line-strong bg-white text-ink-soft flex items-center justify-center text-base leading-none hover:border-forest hover:text-forest-dark transition ${className}`}
      {...props}
    >
      ×
    </button>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 border border-line-strong rounded-card bg-white font-sans text-sm text-ink placeholder:text-ink-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full px-3 py-2 border border-line-strong rounded-card bg-white font-sans text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function TextArea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full px-3 py-2 border border-line-strong rounded-card bg-white font-sans text-sm text-ink placeholder:text-ink-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest ${className}`}
      {...props}
    />
  );
}

export function Label({ className = "", children, ...props }) {
  return (
    <label className={`block text-xs text-ink-soft mb-1 ${className}`} {...props}>
      {children}
    </label>
  );
}

export function Card({ className = "", ...props }) {
  return (
    <div className={`bg-white border border-line rounded-md ${className}`} {...props} />
  );
}

export function Badge({ tone = "neutral", className = "", children }) {
  const tones = {
    neutral: "bg-paper-deep text-ink-soft",
    forest: "bg-forest-tint text-forest-dark",
    rust: "bg-rust-tint text-rust",
    brass: "bg-brass-tint text-brass",
    purple: "bg-[#EDEAF2] text-[#5B4E8A]",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Modal({ onClose, children, widthClass = "max-w-sm" }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/35 flex items-center justify-center z-[100] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white p-5 sm:p-6 rounded-md w-full ${widthClass} font-sans max-h-[85vh] overflow-y-auto relative`}
      >
        <IconButton onClick={onClose} className="absolute top-3 right-3" />
        {children}
      </div>
    </div>
  );
}
export function SiteFooter({ className = "" }) {
  return (
    <footer className={`px-4 sm:px-8 py-6 text-center sm:text-left text-xs text-ink-soft/70 font-sans ${className}`}>
      © {new Date().getFullYear()} Cooperative CRM, a Corporate Bundles product.{" "}
      <a href="/privacy" className="underline hover:text-forest-dark">Privacy Policy</a>
    </footer>
  );
}
