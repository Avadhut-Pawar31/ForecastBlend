import React from 'react';

export default function MaharashtraOutline(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(224, 242, 254, 0.9)" />
          <stop offset="100%" stopColor="rgba(186, 230, 253, 0.95)" />
        </linearGradient>
        <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(37, 99, 235, 0.06)" strokeWidth="1" />
        </pattern>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Grid background overlay */}
      <rect width="800" height="600" fill="url(#radarGrid)" />

      {/* Radar distance rings */}
      <circle cx="400" cy="300" r="120" stroke="rgba(37, 99, 235, 0.12)" strokeWidth="1" strokeDasharray="4 4" fill="none" />
      <circle cx="400" cy="300" r="220" stroke="rgba(37, 99, 235, 0.08)" strokeWidth="1" strokeDasharray="4 4" fill="none" />

      {/* Main Maharashtra Region Contour */}
      <path
        d="M 160,250 C 190,190 260,170 330,160 C 420,150 510,130 600,160 C 670,180 730,220 720,290 C 710,360 630,410 560,450 C 470,500 360,490 280,470 C 210,450 140,410 130,340 Z"
        fill="url(#mapGradient)"
        stroke="rgba(37, 99, 235, 0.6)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {/* Sub-region divides */}
      <path
        d="M 280,165 C 290,260 300,380 320,475"
        stroke="rgba(30, 41, 59, 0.12)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
      <path
        d="M 500,140 C 510,250 520,350 540,460"
        stroke="rgba(30, 41, 59, 0.12)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />

      {/* Region Name Watermarks */}
      <text x="210" y="220" fill="rgba(30, 41, 59, 0.2)" fontSize="18" fontWeight="bold">KONKAN</text>
      <text x="360" y="240" fill="rgba(30, 41, 59, 0.2)" fontSize="18" fontWeight="bold">PASCHIM MAHARASHTRA</text>
      <text x="580" y="260" fill="rgba(30, 41, 59, 0.2)" fontSize="18" fontWeight="bold">VIDARBHA</text>
    </svg>
  );
}
