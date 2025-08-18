import React from 'react';

const LogoIcon = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 1024 1024"
      className={className}
    >
      {/* ===== Gradients ===== */}
      <defs>
        {/* Helmet teal highlight */}
        <linearGradient id="gHelmet" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0b1a24"/>
          <stop offset="0.55" stopColor="#0b1a24"/>
          <stop offset="1" stopColor="#1aa1a6"/>
        </linearGradient>

        {/* Arrow cyan-to-teal */}
        <linearGradient id="gArrow" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#0f2a4d"/>
          <stop offset="0.45" stopColor="#1e6a7a"/>
          <stop offset="1" stopColor="#37b5bc"/>
        </linearGradient>

        {/* Warm mountains (yellow→orange) */}
        <linearGradient id="gWarm" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#b7462b"/>
          <stop offset="0.5" stopColor="#e86a2b"/>
          <stop offset="1" stopColor="#f4b41a"/>
        </linearGradient>

        {/* Cool mountains (navy→blue) */}
        <linearGradient id="gCool" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#0e233f"/>
          <stop offset="1" stopColor="#244f7a"/>
        </linearGradient>

        {/* Shield clip (keeps hills/arrow inside) */}
        <clipPath id="clipShield">
          <path d="M220 500 L804 500 L804 620
                   C804 800, 676 900, 512 960
                   C348 900, 220 800, 220 620 Z"/>
        </clipPath>
      </defs>

      {/* ===== Helmet (safety shape with brim and highlights) ===== */}
      <path d="M220 320
               C260 220, 360 180, 512 180
               C664 180, 764 220, 804 320
               C828 380, 844 440, 848 500
               L176 500
               C180 440, 196 380, 220 320 Z"
            fill="url(#gHelmet)"/>
      {/* Brim */}
      <rect x="176" y="490" width="672" height="42" rx="20" ry="20" fill="#0b1a24"/>
      {/* Top ridges (subtle) */}
      <path d="M454 188 C444 240, 440 290, 440 332 L584 332 C584 290, 580 240, 570 188 Z"
            fill="#163c52"/>
      <path d="M244 332 C304 274, 360 246, 408 234 L396 332 Z" fill="#163c52"/>
      <path d="M780 332 C720 274, 664 246, 616 234 L628 332 Z" fill="#163c52"/>

      {/* ===== Shield ===== */}
      <path d="M220 500 L804 500 L804 620
               C804 800, 676 900, 512 960
               C348 900, 220 800, 220 620 Z"
            fill="#ffffff" stroke="#0a1a24" strokeWidth="16"/>

      {/* ===== Inside shield content (clipped) ===== */}
      <g clipPath="url(#clipShield)">
        {/* Warm mountain band */}
        <path d="M262 708
                   L360 662 428 690 512 648 598 686 668 652 760 704
                   L760 840 262 840 Z"
              fill="url(#gWarm)"/>
        {/* Cool front mountains */}
        <path d="M280 860
                   L404 800 438 828 512 784 588 830 636 802 744 860
                   L744 960 280 960 Z"
              fill="url(#gCool)"/>

        {/* Ridge highlight lines */}
        <path d="M340 830 L404 800 438 828 512 784 588 830 636 802"
              fill="none" stroke="#e6f3ff" strokeOpacity="0.45" strokeWidth="4"/>

        {/* Upward arrow (centered) */}
        <path d="M470 900 L470 620 L420 620 L512 520 L604 620 L554 620 L554 900 Z"
              fill="url(#gArrow)"/>
      </g>

      {/* Inner shield rim (soft) */}
      <path d="M232 606 C232 772, 352 864, 512 912
               C672 864, 792 772, 792 606 L792 536 L232 536 Z"
            fill="none" stroke="#0a1a24" strokeOpacity="0.32" strokeWidth="10"/>

    </svg>
  );
};

export default LogoIcon;