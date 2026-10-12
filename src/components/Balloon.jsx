import React from 'react';
import { Box, Typography } from '@mui/material';
import { BALLOON_COLORS } from '../utils/phonicsData';

const BALLOON_GRADIENTS = [
  ['#FF4081', '#F50057'],
  ['#7C4DFF', '#651FFF'],
  ['#00E676', '#00C853'],
  ['#FF9100', '#FF6D00'],
  ['#00B0FF', '#0091EA'],
  ['#FFD600', '#FFAB00'],
  ['#E040FB', '#D500F9'],
  ['#FF5252', '#D50000'],
];

const Balloon = ({ letter, colorIndex = 0, isPopped = false, balloonCount = 3, onClick, letterCase = 'both', hintEmoji = null }) => {
  const [startColor, endColor] = BALLOON_GRADIENTS[colorIndex % BALLOON_GRADIENTS.length];
  const floatClass = `balloon-float-${colorIndex % 6}`;

  const displayLetter = letterCase === 'lowercase'
    ? letter.toLowerCase()
    : letterCase === 'uppercase'
    ? letter.toUpperCase()
    : `${letter.toUpperCase()}${letter.toLowerCase()}`;

  const baseSize = balloonCount <= 2 ? 180 : balloonCount <= 4 ? 150 : 130;

  return (
    <Box
      onClick={() => !isPopped && onClick && onClick(letter)}
      className={`balloon-wrapper ${floatClass}`}
      sx={{
        width: { xs: `${baseSize * 0.75}px`, sm: `${baseSize}px` },
        height: { xs: `${baseSize * 1.05}px`, sm: `${baseSize * 1.35}px` },
        cursor: isPopped ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        opacity: isPopped ? 0 : 1,
        transform: isPopped ? 'scale(1.4)' : 'scale(1)',
        transition: 'opacity 0.25s, transform 0.25s',
        filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.18))',
      }}
    >
      <svg viewBox="0 0 120 160" width="100%" height="100%">
        <defs>
          <radialGradient id={`balloon-grad-${colorIndex}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="40%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </radialGradient>
        </defs>

        {/* Balloon Body */}
        <path
          d="M 60 10 C 25 10 10 40 10 70 C 10 105 38 125 56 128 L 52 135 L 68 135 L 64 128 C 82 125 110 105 110 70 C 110 40 95 10 60 10 Z"
          fill={`url(#balloon-grad-${colorIndex})`}
        />

        {/* Highlight Reflection */}
        <ellipse cx="38" cy="40" rx="10" ry="18" transform="rotate(-25 38 40)" fill="#FFFFFF" opacity="0.35" />

        {/* Balloon String */}
        <path
          d="M 60 135 Q 52 145 62 152 T 58 160"
          stroke="#7F8C8D"
          strokeWidth="2.5"
          fill="none"
        />

        {/* Letter Text */}
        <text
          x="60"
          y="72"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Fredoka', 'Quicksand', sans-serif"
          fontWeight="800"
          fontSize={letterCase === 'both' ? '32' : '42'}
          fill="#FFFFFF"
          style={{
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))',
          }}
        >
          {displayLetter}
        </text>

        {/* Optional Hint Emoji */}
        {hintEmoji && (
          <text
            x="60"
            y="102"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="18"
          >
            {hintEmoji}
          </text>
        )}
      </svg>
    </Box>
  );
};

export default Balloon;
