"use client";

import { memo } from "react";

/**
 * Detailed SVG rendition of the physical printed SNS College campus map
 * with proper color scheme and building layout matching the photograph.
 */
function DetailedPrintedMapSVG() {
  return (
    <svg
      viewBox="0 0 1200 820"
      preserveAspectRatio="xMidYMid slice"
      className="w-full h-full"
      shapeRendering="geometricPrecision"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        {/* Printed paper gradient */}
        <radialGradient id="paper-bg" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor="#f5c66d" />
          <stop offset="50%" stopColor="#e8a847" />
          <stop offset="100%" stopColor="#d89040" />
        </radialGradient>

        {/* Paper texture */}
        <pattern id="paper-texture" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="transparent" />
          <circle cx="2" cy="2" r="0.5" fill="rgba(0,0,0,0.03)" />
          <circle cx="5" cy="5" r="0.4" fill="rgba(255,255,255,0.05)" />
        </pattern>

        {/* Shadow filter */}
        <filter id="shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
          <feOffset dx="0.5" dy="1" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Paper Background */}
      <rect width="1200" height="820" fill="url(#paper-bg)" />
      <rect width="1200" height="820" fill="url(#paper-texture)" />

      {/* Compass Rose - Top Right */}
      <g transform="translate(1050, 80)">
        <circle cx="0" cy="0" r="35" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        <circle cx="0" cy="0" r="30" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
        
        {/* Cardinal directions */}
        <text x="0" y="-38" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">N</text>
        <text x="0" y="48" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">S</text>
        <text x="-48" y="5" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">W</text>
        <text x="48" y="5" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">E</text>

        {/* Cardinal lines */}
        <line x1="0" y1="-25" x2="0" y2="-32" stroke="#333" strokeWidth="1.5" />
        <line x1="0" y1="25" x2="0" y2="32" stroke="#333" strokeWidth="1.5" />
        <line x1="-25" y1="0" x2="-32" y2="0" stroke="#333" strokeWidth="1.5" />
        <line x1="25" y1="0" x2="32" y2="0" stroke="#333" strokeWidth="1.5" />
      </g>

      {/* Title */}
      <text x="600" y="35" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#2c3e50">
        SNS College of Engineering Campus Map
      </text>

      {/* Buildings Group - Top Section */}
      <g filter="url(#shadow)">
        {/* Boys Hostel G-Block */}
        <rect x="80" y="70" width="180" height="80" fill="#3d4855" stroke="#1a1a1a" strokeWidth="1.5" rx="2" />
        <text x="170" y="115" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white" fontFamily="Arial">Boys Hostel</text>
        <text x="170" y="130" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial">G-Block</text>

        {/* Boys Hostel H-Block */}
        <rect x="280" y="80" width="110" height="100" fill="#3d4855" stroke="#1a1a1a" strokeWidth="1.5" rx="2" />
        <text x="335" y="130" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" textLength="80">H-Block</text>

        {/* Athletic Track */}
        <ellipse cx="450" cy="130" rx="120" ry="90" fill="#8b4789" stroke="#3d2d47" strokeWidth="2" />
        <ellipse cx="450" cy="130" rx="100" ry="70" fill="#a85fa0" stroke="none" />
        <text x="450" y="120" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">Athletic</text>
        <text x="450" y="135" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">Track</text>

        {/* Cricket Pitch */}
        <rect x="620" y="100" width="70" height="70" fill="#7fb858" stroke="#5d7f38" strokeWidth="1.5" rx="2" />
        <text x="655" y="138" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">Cricket</text>

        {/* Football Ground */}
        <rect x="700" y="80" width="70" height="100" fill="#d98b41" stroke="#9d5a2a" strokeWidth="1.5" rx="2" />
        <text x="735" y="130" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" textLength="60">Football</text>

        {/* Girls Hostel */}
        <rect x="800" y="100" width="80" height="150" fill="#b8538a" stroke="#7a2d5a" strokeWidth="1.5" rx="2" />
        <text x="840" y="175" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">Girls</text>
        <text x="840" y="188" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">Hostel</text>

        {/* SNSCT AI Campus D-Block */}
        <rect x="80" y="180" width="120" height="140" fill="#3aa75a" stroke="#2a7a3a" strokeWidth="1.5" rx="2" />
        <text x="140" y="255" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">SNSCT AI</text>
        <text x="140" y="268" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">D-Block</text>

        {/* SNSCT AI Campus B-Block */}
        <rect x="210" y="180" width="200" height="160" fill="#2d9a4f" stroke="#1a6a2a" strokeWidth="1.5" rx="2" />
        <text x="310" y="265" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">SNSCT AI Campus</text>
        <text x="310" y="280" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">B-Block</text>

        {/* SNSCT AI Campus A-Block */}
        <rect x="420" y="180" width="140" height="160" fill="#4fb070" stroke="#2a8a3f" strokeWidth="1.5" rx="2" />
        <text x="490" y="260" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">AI Campus</text>
        <text x="490" y="275" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">A-Block</text>

        {/* Wooden Shuttle Court */}
        <rect x="620" y="220" width="100" height="80" fill="#c53030" stroke="#8a1f1f" strokeWidth="1.5" rx="2" />
        <text x="670" y="263" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">Wooden</text>
        <text x="670" y="276" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">Shuttle</text>

        {/* SNS Pharmacy */}
        <rect x="740" y="220" width="180" height="80" fill="#d65f4a" stroke="#9a3a2a" strokeWidth="1.5" rx="2" />
        <text x="830" y="263" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">SNS College of</text>
        <text x="830" y="276" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">Pharmacy</text>

        {/* Innovation Hub */}
        <rect x="920" y="220" width="180" height="160" fill="#d4307a" stroke="#9a0a4a" strokeWidth="2" rx="2" />
        <text x="1010" y="305" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">SNS</text>
        <text x="1010" y="320" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">iNNovation Hub</text>

        {/* Urban Space Food Court */}
        <rect x="620" y="310" width="120" height="70" fill="#e89045" stroke="#a85a1f" strokeWidth="1.5" rx="2" />
        <text x="680" y="345" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">Urban Space</text>
        <text x="680" y="358" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">Food Court</text>

        {/* DT Club House */}
        <rect x="620" y="390" width="100" height="120" fill="#c53030" stroke="#8a1f1f" strokeWidth="1.5" rx="2" />
        <text x="670" y="450" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">DT Club</text>
        <text x="670" y="463" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">House</text>

        {/* Chanakya Bhavan */}
        <rect x="740" y="340" width="140" height="80" fill="#5fa84a" stroke="#3a7a2a" strokeWidth="1.5" rx="2" />
        <text x="810" y="382" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">Chanakya</text>
        <text x="810" y="395" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">Bhavan</text>

        {/* Uliyum Nanum - Central Circle */}
        <circle cx="700" cy="550" r="110" fill="#7fb858" stroke="#5a8a38" strokeWidth="2" />
        <circle cx="700" cy="550" r="95" fill="#6fa848" stroke="none" />
        <text x="700" y="545" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">Uliyum</text>
        <text x="700" y="560" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">Nanum</text>

        {/* Library */}
        <rect x="620" y="480" width="120" height="50" fill="#3f88b8" stroke="#1a5a88" strokeWidth="1.5" rx="2" />
        <text x="680" y="510" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">Library</text>

        {/* Sports Courts - Bottom Left */}
        <rect x="80" y="520" width="65" height="50" fill="#8a2030" stroke="#5a1020" strokeWidth="1.5" rx="2" />
        <text x="112" y="550" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">Volleyball</text>

        <rect x="80" y="575" width="65" height="50" fill="#8a2030" stroke="#5a1020" strokeWidth="1.5" rx="2" />
        <text x="112" y="605" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">Volleyball II</text>

        {/* Nursing College */}
        <rect x="80" y="660" width="220" height="80" fill="#c93c7a" stroke="#8a1a4a" strokeWidth="1.5" rx="2" />
        <text x="190" y="705" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">SNS College of Nursing</text>

        {/* Boys Hostel Siruvani */}
        <rect x="460" y="590" width="60" height="120" fill="#c53030" stroke="#8a1f1f" strokeWidth="1.5" rx="2" />
        <text x="490" y="652" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white" textLength="50">Hostel</text>

        {/* Boys Hostel Vaigai */}
        <rect x="530" y="590" width="60" height="120" fill="#a85030" stroke="#7a2a1f" strokeWidth="1.5" rx="2" />
        <text x="560" y="652" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white" textLength="50">Hostel</text>

        {/* Mess Block */}
        <rect x="460" y="510" width="90" height="70" fill="#e89045" stroke="#a85a1f" strokeWidth="1.5" rx="2" />
        <text x="505" y="550" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">Mess</text>

        {/* Admin Blocks A, B, C - Bottom Right */}
        <rect x="850" y="590" width="40" height="150" fill="#666666" stroke="#333333" strokeWidth="1.5" rx="2" />
        <text x="870" y="665" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">Admin</text>
        <text x="870" y="675" textAnchor="middle" fontSize="6" fontWeight="bold" fill="white">A</text>

        <rect x="900" y="590" width="40" height="150" fill="#666666" stroke="#333333" strokeWidth="1.5" rx="2" />
        <text x="920" y="665" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">Admin</text>
        <text x="920" y="675" textAnchor="middle" fontSize="6" fontWeight="bold" fill="white">B</text>

        <rect x="950" y="590" width="40" height="150" fill="#666666" stroke="#333333" strokeWidth="1.5" rx="2" />
        <text x="970" y="665" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">Admin</text>
        <text x="970" y="675" textAnchor="middle" fontSize="6" fontWeight="bold" fill="white">C</text>

        {/* Front Gate - Bottom Center */}
        <rect x="520" y="750" width="80" height="35" fill="#3d4855" stroke="#1a1a1a" strokeWidth="2" rx="3" />
        <text x="560" y="773" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">Front Gate</text>

        {/* Admission Center X-Block */}
        <rect x="420" y="720" width="90" height="45" fill="#888888" stroke="#555555" strokeWidth="1.5" rx="2" />
        <text x="465" y="748" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">Admission</text>

        {/* Clinic */}
        <rect x="420" y="770" width="50" height="30" fill="#888888" stroke="#555555" strokeWidth="1.5" rx="2" />
        <text x="445" y="790" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">Clinic</text>

        {/* ATM */}
        <rect x="475" y="770" width="50" height="30" fill="#888888" stroke="#555555" strokeWidth="1.5" rx="2" />
        <text x="500" y="790" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">ATM</text>

        {/* Parking Areas */}
        <rect x="350" y="520" width="40" height="200" fill="#aaaaaa" stroke="#777777" strokeWidth="1" rx="2" />
        <text x="370" y="620" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#333" textLength="35">Parking</text>
      </g>

      {/* Border Frame */}
      <rect x="8" y="8" width="1184" height="804" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" rx="6" />
    </svg>
  );
}

export const DetailedPrintedMap = memo(DetailedPrintedMapSVG);
