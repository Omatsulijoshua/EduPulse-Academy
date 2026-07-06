import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizeMap = {
    sm: { icon: 32, fontTitle: "text-lg", fontSub: "text-[9px]" },
    md: { icon: 44, fontTitle: "text-2xl", fontSub: "text-[11px]" },
    lg: { icon: 72, fontTitle: "text-4xl", fontSub: "text-sm" },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Brand Icon SVG */}
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform hover:rotate-12 transition-transform duration-300"
      >
        {/* Outer Ring with Gradients */}
        <circle cx="50" cy="50" r="46" stroke="url(#logo_ring_grad)" strokeWidth="4" />
        
        {/* Pulsing/Wave Symbol */}
        <path
          d="M 12 50 L 26 50 L 32 40 L 38 60 L 44 48 L 48 50 L 52 50 L 56 52 L 62 40 L 68 60 L 74 50 L 88 50"
          stroke="url(#logo_pulse_grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
        />

        {/* Open Book */}
        <path
          d="M 28 66 C 36 66, 46 64, 50 58 C 54 64, 64 66, 72 66 L 72 46 C 64 46, 54 44, 50 38 C 46 44, 36 46, 28 46 Z"
          fill="url(#logo_book_grad)"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
        
        {/* Ribbon bookmark */}
        <path d="M 50 38 L 50 62" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />

        {/* Celebrating Student (Graduation figure) */}
        <path
          d="M 50 26 C 53.3137 26 56 23.3137 56 20 C 56 16.6863 53.3137 14 50 14 C 46.6863 14 44 16.6863 44 20 C 44 23.3137 46.6863 26 50 26 Z"
          fill="#1d4ed8"
        />
        <path
          d="M 33 28 C 41 24, 44 32, 50 32 C 56 32, 59 24, 67 28 C 61 38, 56 46, 50 46 C 44 46, 39 38, 33 28 Z"
          fill="#2563eb"
        />

        {/* Graduation Cap */}
        <path
          d="M 50 6 L 72 13 L 50 20 L 28 13 Z"
          fill="#1e3a8a"
          stroke="#ffffff"
          strokeWidth="1"
        />
        <path d="M 68 14.5 L 68 23" stroke="#d97706" strokeWidth="1.5" />
        <circle cx="68" cy="24.5" r="1.5" fill="#d97706" />

        {/* Definition of Gradients */}
        <defs>
          <linearGradient id="logo_ring_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e40af" /> {/* Royal Blue */}
            <stop offset="0.5" stopColor="#059669" /> {/* Emerald Green */}
            <stop offset="1" stopColor="#fbbf24" /> {/* Gold */}
          </linearGradient>
          <linearGradient id="logo_pulse_grad" x1="0" y1="50" x2="100" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563eb" />
            <stop offset="1" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="logo_book_grad" x1="28" y1="50" x2="72" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e3a8a" />
            <stop offset="0.5" stopColor="#1e40af" />
            <stop offset="0.51" stopColor="#047857" />
            <stop offset="1" stopColor="#065f46" />
          </linearGradient>
        </defs>
      </svg>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col select-none">
          <span className={`font-extrabold tracking-tight ${currentSize.fontTitle} bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-emerald-600 to-amber-500 dark:from-blue-400 dark:via-emerald-400 dark:to-amber-400`}>
            ClassNova
          </span>
          <span className={`font-semibold tracking-widest text-muted-foreground uppercase ${currentSize.fontSub}`}>
            Academy
          </span>
        </div>
      )}
    </div>
  );
}
