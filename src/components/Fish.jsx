import React from 'react';
import { Box } from '@mui/material';

const FISH_COLORS = [
  ['#FF80AB', '#FF4081'], // Coral Pink
  ['#B388FF', '#7C4DFF'], // Violet
  ['#B9F6CA', '#00E676'], // Mint Green
  ['#FFD180', '#FF9100'], // Golden Orange
  ['#80D8FF', '#00B0FF'], // Sky Blue
  ['#FFE57F', '#FFD600'], // Bright Yellow
];

const Fish = ({ letter, colorIndex = 0, isCaught = false, onClick, letterCase = 'both' }) => {
  const [lightColor, darkColor] = FISH_COLORS[colorIndex % FISH_COLORS.length];

  const displayLetter = letterCase === 'lowercase'
    ? letter.toLowerCase()
    : letterCase === 'uppercase'
    ? letter.toUpperCase()
    : `${letter.toUpperCase()}${letter.toLowerCase()}`;

  return (
    <Box
      onClick={() => !isCaught && onClick && onClick(letter)}
      className="swimming-fish"
      sx={{
        width: { xs: '110px', sm: '140px' },
        height: { xs: '75px', sm: '95px' },
        cursor: isCaught ? 'default' : 'pointer',
        display: 'inline-block',
        position: 'relative',
        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s',
        opacity: isCaught ? 0 : 1,
        transform: isCaught ? 'scale(1.3) translateY(-40px)' : 'scale(1)',
        filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.28))',
        '&:hover': {
          transform: isCaught ? 'none' : 'scale(1.12)',
        },
      }}
    >
      <svg viewBox="0 0 120 85" width="100%" height="100%">
        <defs>
          <linearGradient id={`fish-grad-${colorIndex}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={lightColor} />
            <stop offset="100%" stopColor={darkColor} />
          </linearGradient>
        </defs>

        {/* Animated Fish Tail */}
        <g className="wiggle-tail">
          <path
            d="M 100 42.5 L 118 20 Q 110 42.5 118 65 Z"
            fill={darkColor}
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        </g>

        {/* Fish Body */}
        <path
          d="M 15 42.5 C 30 18 80 18 102 42.5 C 80 67 30 67 15 42.5 Z"
          fill={`url(#fish-grad-${colorIndex})`}
          stroke="#FFFFFF"
          strokeWidth="2.5"
        />

        {/* Top Fin */}
        <path
          d="M 45 23 Q 60 10 75 23 Z"
          fill={lightColor}
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />

        {/* Bottom Fin */}
        <path
          d="M 50 62 Q 62 72 72 62 Z"
          fill={lightColor}
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />

        {/* Eye */}
        <circle cx="28" cy="36" r="6" fill="#FFFFFF" />
        <circle cx="26" cy="36" r="3.2" fill="#2D3436" />
        <circle cx="25" cy="34.5" r="1.2" fill="#FFFFFF" />

        {/* Central Circle Badge for Letter */}
        <circle
          cx="60"
          cy="42.5"
          r={letterCase === 'both' ? '18' : '16'}
          fill="#FFFFFF"
          stroke={darkColor}
          strokeWidth="2.5"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
        />

        {/* Letter Text */}
        <text
          x="60"
          y="43.5"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Fredoka', 'Quicksand', sans-serif"
          fontWeight="800"
          fontSize={letterCase === 'both' ? '16' : '22'}
          fill={darkColor}
        >
          {displayLetter}
        </text>
      </svg>
    </Box>
  );
};

export default Fish;
