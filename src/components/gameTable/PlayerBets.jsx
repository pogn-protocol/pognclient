import React from "react";
import PokerChipSVG from "./PokerChipSVG"; // keep this if you're using SVG

const getBetStyle = (seatIndex, totalSeats) => {
  const stylesByCount = {
    1: [{ top: "45%", left: "50%" }],

    2: [
      { top: "130%", left: "40%" },
      { top: "-30%", left: "50%" },
    ],

    3: [
      { top: "130%", left: "40%" },
      { top: "55%", left: "-30%" },
      { top: "55%", left: "125%" },
    ],

    4: [
      { top: "130%", left: "40%" },
      { top: "170%", left: "-25%" },
      { top: "-30%", left: "50%" },
      { top: "-70%", left: "125%" },
    ],

    5: [
      { top: "130%", left: "40%" },
      { top: "-15%", left: "-35%" },
      { top: "0%", left: "-30%" },
      { top: "0%", left: "130%" },
      { top: "-15%", left: "125%" },
    ],

    6: [
      { top: "130%", left: "40%" },
      { top: "45%", left: "-35%" },
      { top: "55%", left: "-30%" },
      { top: "-30%", left: "50%" },
      { top: "55%", left: "125%" },
      { top: "45%", left: "125%" },
    ],

    7: [
      { top: "130%", left: "40%" },
      { top: "45%", left: "-35%" },
      { top: "100%", left: "-25%" },
      { top: "-30%", left: "-5%" },
      { top: "-30%", left: "100%" },
      { top: "-45%", left: "95%" },
      { top: "45%", left: "125%" },
    ],

    8: [
      { top: "130%", left: "40%" },
      { top: "55%", left: "-35%" },
      { top: "-30%", left: "-10%" },
      { top: "0%", left: "-25%" },
      { top: "-30%", left: "95%" },
      { top: "35%", left: "125%" },
      { top: "-30%", left: "100%" },
      { top: "90%", left: "125%" },
    ],

    9: [
      { top: "120%", left: "40%" },
      { top: "85%", left: "-25%" },
      { top: "-15%", left: "-25%" },
      { top: "35%", left: "-35%" },
      { top: "-55%", left: "-5%" },
      { top: "-15%", left: "100%" },
      { top: "-20%", left: "90%" },
      { top: "-15%", left: "115%" },
      { top: "100%", left: "120%" },
    ],
  };

  const fallback = { top: "50%", left: "50%" };
  const coords = stylesByCount[totalSeats]?.[seatIndex] || fallback;

  return {
    position: "absolute",
    left: coords.left,
    top: coords.top,
    transform: "translate(-50%, -50%)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    zIndex: 1,
  };
};

const PlayerBets = ({ amount = 100, seatIndex = 0, totalSeats = 6 }) => {
  const style = getBetStyle(seatIndex, totalSeats);
  return (
    <div style={style}>
      <PokerChipSVG width={20} />
      <span style={{ fontWeight: "bold", fontSize: "0.8rem", color: "black" }}>
        ${amount}
      </span>
    </div>
  );
};

export default PlayerBets;
