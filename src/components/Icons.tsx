type Props = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export const BagIcon = ({ className = "h-5 w-5" }: Props) => (
  <svg {...base} className={className}>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);
export const UserIcon = ({ className = "h-5 w-5" }: Props) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
  </svg>
);
export const CameraIcon =({ className = "h-5 w-5" }: Props) => (
  <svg {...base} className={className}>
    <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.3l1.4-2h7.6l1.4 2h2.3A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-9Z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
export const HeartIcon = ({ className = "h-5 w-5" }: Props) => (
  <svg {...base} className={className}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </svg>
);
export const CloseIcon = ({ className = "h-5 w-5" }: Props) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const SparkIcon = ({ className = "h-5 w-5" }: Props) => (
  <svg {...base} className={className}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
);
export const DownloadIcon = ({ className = "h-5 w-5" }: Props) => (
  <svg {...base} className={className}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </svg>
);
export const ShutterIcon = ({ className = "h-5 w-5" }: Props) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);
