// PokerChipSVG.jsx
import React from "react";

const PokerChipSVG = ({ width = 32 }) => (
  <svg
    width={width}
    height={width}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="50"
      cy="50"
      r="48"
      fill="#d32f2f"
      stroke="#000"
      strokeWidth="4"
    />
    <circle cx="50" cy="50" r="30" fill="#fff" />
    <line x1="50" y1="2" x2="50" y2="18" stroke="#fff" strokeWidth="4" />
    <line x1="50" y1="82" x2="50" y2="98" stroke="#fff" strokeWidth="4" />
    <line x1="2" y1="50" x2="18" y2="50" stroke="#fff" strokeWidth="4" />
    <line x1="82" y1="50" x2="98" y2="50" stroke="#fff" strokeWidth="4" />
    <line x1="21" y1="21" x2="32" y2="32" stroke="#fff" strokeWidth="4" />
    <line x1="79" y1="79" x2="68" y2="68" stroke="#fff" strokeWidth="4" />
    <line x1="79" y1="21" x2="68" y2="32" stroke="#fff" strokeWidth="4" />
    <line x1="21" y1="79" x2="32" y2="68" stroke="#fff" strokeWidth="4" />
  </svg>
);

export default PokerChipSVG;
