/**
 * 共享 SVG 图标组件 — 所有图标集中管理，避免散落各文件的重复 SVG
 */
import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function iconProps(size = 14, className?: string, rest: Omit<IconProps, 'size'> = {}) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    ...rest,
  };
}

export function CloseIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function UserIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function SettingsIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function HelpIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function LogoutIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function PlusIcon({ size = 14, className, strokeWidth, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)} strokeWidth={strokeWidth ?? 2.5}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function SendIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)} strokeWidth={2.5}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function StopIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)} fill="currentColor" stroke="none">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

export function ChatIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function DocumentIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function ExternalLinkIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function LockIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function TrashIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)} strokeWidth={2.5}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function ImagePlaceholderIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

export function ChevronUpIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)} strokeWidth={2.5}>
      <polyline points="6 15 12 9 18 15" />
    </svg>
  );
}

export function SearchIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 14, className, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size, className, rest)}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
