import React from 'react';

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  fullWidth = false,
  className = '',
  temaNoturno = false
}) {
  
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 rounded-xl";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-[11px]",
    md: "px-5 py-2.5 text-[13px]",
    lg: "px-6 py-3 text-base"
  };

  const variants = {
    primary: temaNoturno 
      ? "bg-zinc-100 text-zinc-950 hover:bg-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
      : "bg-zinc-900 text-white hover:bg-black shadow-[0_2px_10px_rgba(0,0,0,0.1)]",
    secondary: temaNoturno
      ? "bg-[#18181B] border border-white/10 text-white hover:bg-zinc-800"
      : "bg-white border border-black/10 text-zinc-900 hover:bg-zinc-50",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-[0_2px_10px_rgba(239,68,68,0.2)]",
    ghost: temaNoturno
      ? "bg-transparent border border-white/[0.1] text-zinc-300 hover:bg-white/[0.04]"
      : "bg-transparent border border-black/[0.1] text-zinc-700 hover:bg-black/[0.02]"
  };

  const widthStyle = fullWidth ? "w-full" : "w-auto";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${widthStyle} ${className}`}
    >
      {children}
    </button>
  );
}