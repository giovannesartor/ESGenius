"use client";

import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { img: 28, text: "text-lg" },
    md: { img: 36, text: "text-xl" },
    lg: { img: 48, text: "text-3xl" },
  };

  const s = sizes[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Image src="/logo-icon.png" alt="ESGenius" width={s.img} height={s.img} priority />
      {showText && (
        <span className={`font-bold tracking-tight ${s.text}`}>
          <span className="text-brand-green">ESG</span>
          <span className="text-brand-blue">enius</span>
        </span>
      )}
    </span>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Leaf */}
      <path
        d="M24 4C14 4 8 14 8 24c0 4 1.5 7.5 4 10.5C14 30 18 24 24 20c-4 6-6 12-6.5 18.5C19.5 40 21.5 41 24 41c11 0 20-8 20-19C44 12 34 4 24 4z"
        fill="#16a34a"
        opacity="0.9"
      />
      {/* Chart bars */}
      <rect x="22" y="14" width="4" height="12" rx="1" fill="#2563eb" />
      <rect x="28" y="10" width="4" height="16" rx="1" fill="#2563eb" />
      <rect x="34" y="6" width="4" height="20" rx="1" fill="#2563eb" />
      {/* Sun dot */}
      <circle cx="30" cy="6" r="3" fill="#f59e0b" />
      {/* Circuit lines */}
      <path
        d="M10 32c2-1 4-2 7-2.5M12 36c2-0.5 4-1 6-1.5"
        stroke="#64748b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="32" r="1.5" fill="#64748b" />
      <circle cx="12" cy="36" r="1.5" fill="#64748b" />
    </svg>
  );
}
