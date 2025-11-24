
import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

// Helper for duotone style: primary opacity 1, secondary opacity 0.4
const DuotoneIcon: React.FC<IconProps & { children: React.ReactNode }> = ({ size = 20, className = "", children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {children}
  </svg>
);

export const IconHome: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor" fillOpacity="0.2" />
    <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </DuotoneIcon>
);

export const IconCrash: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <path d="M4.5 19.5C4.5 19.5 8.5 9.5 18.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M18.5 4.5L14.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M18.5 4.5L18.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M4.5 19.5L21 19.5V4.5L18.5 4.5" fill="currentColor" fillOpacity="0.15" />
  </DuotoneIcon>
);

export const IconPlinko: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <circle cx="12" cy="6" r="2" fill="currentColor" />
    <circle cx="7" cy="12" r="2" fill="currentColor" fillOpacity="0.4" />
    <circle cx="17" cy="12" r="2" fill="currentColor" fillOpacity="0.4" />
    <circle cx="2" cy="18" r="2" fill="currentColor" fillOpacity="0.2" />
    <circle cx="12" cy="18" r="2" fill="currentColor" fillOpacity="0.2" />
    <circle cx="22" cy="18" r="2" fill="currentColor" fillOpacity="0.2" />
  </DuotoneIcon>
);

export const IconMines: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <path d="M12 6V4M12 20V18M6 12H4M20 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </DuotoneIcon>
);

export const IconDice: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" fillOpacity="0.5" />
  </DuotoneIcon>
);

export const IconLimbo: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <path d="M21 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
    <path d="M12 6V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </DuotoneIcon>
);

export const IconWheel: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
    <path d="M12 3V12" stroke="currentColor" strokeWidth="2" />
    <path d="M12 12L19.79 16.5" stroke="currentColor" strokeWidth="2" />
    <path d="M12 12L4.21 16.5" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </DuotoneIcon>
);

export const IconHilo: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
    <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </DuotoneIcon>
);

export const IconCoinFlip: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
    <path d="M12 6V18" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
    <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
    <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.3" />
  </DuotoneIcon>
);

export const IconTower: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <rect x="6" y="18" width="12" height="4" rx="1" fill="currentColor" />
    <rect x="8" y="13" width="8" height="4" rx="1" fill="currentColor" fillOpacity="0.7" />
    <rect x="10" y="8" width="4" height="4" rx="1" fill="currentColor" fillOpacity="0.4" />
    <rect x="11" y="3" width="2" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
  </DuotoneIcon>
);

export const IconSlots: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M8 6V18" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
    <path d="M16 6V18" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
    <rect x="4" y="10" width="2" height="4" fill="currentColor" />
    <rect x="11" y="10" width="2" height="4" fill="currentColor" />
    <rect x="18" y="10" width="2" height="4" fill="currentColor" />
  </DuotoneIcon>
);

export const IconKeno: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
    <circle cx="8" cy="8" r="2" fill="currentColor" />
    <circle cx="16" cy="16" r="2" fill="currentColor" />
    <circle cx="16" cy="8" r="2" fill="currentColor" fillOpacity="0.3" />
    <circle cx="8" cy="16" r="2" fill="currentColor" fillOpacity="0.3" />
  </DuotoneIcon>
);

export const IconRoulette: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 3V12" stroke="currentColor" strokeWidth="2" />
    <path d="M12 12L18.36 18.36" stroke="currentColor" strokeWidth="2" />
    <path d="M12 12L5.64 18.36" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </DuotoneIcon>
);

export const IconBlackjack: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <rect x="4" y="8" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2" />
    <rect x="8" y="4" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" className="bg-background" />
    <path d="M14 8L14 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </DuotoneIcon>
);

export const IconLoot: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <path d="M12 2L20 6V16L12 20L4 16V6L12 2Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
    <path d="M4 6L12 10L20 6" stroke="currentColor" strokeWidth="2" />
    <path d="M12 20V10" stroke="currentColor" strokeWidth="2" />
  </DuotoneIcon>
);

export const IconSlither: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <path d="M4 16C4 16 5 13 8 13C11 13 11 16 14 16C17 16 17 13 20 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="20" cy="13" r="2" fill="currentColor" />
    <circle cx="4" cy="16" r="1" fill="currentColor" fillOpacity="0.5" />
  </DuotoneIcon>
);

export const IconPaper: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
    <path d="M8 8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 12H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </DuotoneIcon>
);

export const IconSicBo: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
    <rect x="6" y="9" width="3" height="3" fill="currentColor" />
    <rect x="10.5" y="9" width="3" height="3" fill="currentColor" fillOpacity="0.6" />
    <rect x="15" y="9" width="3" height="3" fill="currentColor" fillOpacity="0.3" />
  </DuotoneIcon>
);

export const IconThimbles: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <path d="M5 19H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 19L8 6H16L18 19" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
    <path d="M8 6H16" stroke="currentColor" strokeWidth="2" />
  </DuotoneIcon>
);

export const IconCandySmash: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <path d="M12 2L19 8L12 22L5 8L12 2Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M5 8H19" stroke="currentColor" strokeWidth="1" />
    <path d="M12 22V8" stroke="currentColor" strokeWidth="1" />
  </DuotoneIcon>
);

export const IconStaircase: React.FC<IconProps> = (props) => (
  <DuotoneIcon {...props}>
    <path d="M4 20V16H8V12H12V8H16V4H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="4" y="20" width="16" height="2" fill="currentColor" fillOpacity="0.2" />
  </DuotoneIcon>
);
