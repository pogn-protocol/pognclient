import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./gameTable.css";
import PlayerHUD from "./PlayerHUD";

const CONFIG = {
  seatCountMin: 2,
  seatCountMax: 9,
  seatPaddingRatio: 0.1,
  tableRatio: 2 / 1,
};

const GameTable = ({ activePlayerId, players = [], nostrProfileData }) => {
  const [seatCount, setSeatCount] = useState(6);
  const [playersAtTable, setPlayersAtTable] = useState([]);
  const tableRef = useRef(null);
  const [tableSize, setTableSize] = useState({ width: 600, height: 300 });

  useEffect(() => {
    setPlayersAtTable((prev) => {
      const updated = Array(seatCount).fill(null);
      for (let i = 0; i < Math.min(prev.length, seatCount); i++) {
        updated[i] = prev[i];
      }
      return updated;
    });
  }, [seatCount]);

  useEffect(() => {
    const updateSize = () => {
      if (tableRef.current) {
        const width = tableRef.current.offsetWidth;
        const height = width / CONFIG.tableRatio;
        setTableSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleSeatChange = (e) => {
    const newCount = parseInt(e.target.value);
    setSeatCount(newCount);
    setPlayersAtTable((prev) => {
      const updated = Array(newCount).fill(null);
      for (let i = 0; i < Math.min(prev.length, newCount); i++) {
        updated[i] = prev[i];
      }
      return updated;
    });
  };

  const handleSitInternal = (idx) => {
    setPlayersAtTable((prev) => {
      if (prev.includes(activePlayerId)) return prev;
      const updated = [...prev];
      updated[idx] = activePlayerId;
      return updated;
    });
  };

  const handleLeaveTable = () => {
    if (!activePlayerId) return;
    setPlayersAtTable((prev) =>
      prev.map((id) => (id === activePlayerId ? null : id))
    );
  };

  const { width, height } = tableSize;
  const cx = width / 2;
  const cy = height / 2;
  const radiusX = width / 2;
  const radiusY = height / 2;
  const seatOffsetX = radiusX * CONFIG.seatPaddingRatio;
  const seatOffsetY = radiusY * CONFIG.seatPaddingRatio;

  function getCards() {
    const CARD_BACK_URL = "https://deckofcardsapi.com/static/img/back.png";
    return Array(5)
      .fill(null)
      .map((_, idx) => ({
        id: idx,
        src: CARD_BACK_URL,
        alt: "Card",
      }));
  }

  function getFaceUpCards() {
    const suits = ["S", "H", "D", "C"]; // Spades, Hearts, Diamonds, Clubs
    const values = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ];
    const deck = [];

    for (let suit of suits) {
      for (let value of values) {
        const code = value + suit;
        deck.push({
          id: code,
          src: `https://deckofcardsapi.com/static/img/${code}.png`,
          alt: `${value} of ${suit}`,
        });
      }
    }

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // return deck.slice(0, 5); // Return 5 random cards
    return [];
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column align-items-center">
        <h2 className="text-center mb-3">Demo Table</h2>

        <div className="mb-4 w-100" style={{ maxWidth: "300px" }}>
          <label htmlFor="seatCount" className="form-label">
            Number of Seats
          </label>
          <select
            id="seatCount"
            className="form-select"
            value={seatCount}
            onChange={handleSeatChange}
          >
            {Array.from(
              { length: CONFIG.seatCountMax - CONFIG.seatCountMin + 1 },
              (_, i) => i + CONFIG.seatCountMin
            ).map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        <div
          ref={tableRef}
          className="gameTableDiv position-relative m-5 px-4"
          style={{
            width: "80%",
            maxWidth: "900px",
            aspectRatio: CONFIG.tableRatio,
          }}
        >
          <div className="gameTable-center">
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "4vw",
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.25)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                zIndex: 0,
                textShadow: "1px 1px 2px rgba(0,0,0,0.4)",
              }}
            >
              ♠ Game Board ♣
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                gap: "8px",
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {getFaceUpCards().map((card) => (
                <img
                  key={card.id}
                  src={card.src}
                  alt={card.alt}
                  style={{
                    width: "40px",
                    height: "auto",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {Array(seatCount)
            .fill(null)
            .map((_, idx) => {
              const angle = (2 * Math.PI * idx) / seatCount - Math.PI / 2;
              const x = cx + (radiusX + seatOffsetX) * Math.cos(angle);
              const y = cy + (radiusY + seatOffsetY) * Math.sin(angle);

              const playerId = playersAtTable[idx];
              const playerObj = players.find((p) => p.id === playerId);

              return (
                <PlayerHUD
                  key={idx}
                  playerId={playerId}
                  playerObj={playerObj}
                  seat={{
                    top: (y / height) * 100,
                    left: (x / width) * 100,
                  }}
                  onClick={() => {
                    if (
                      (!playerId || playerId === activePlayerId) &&
                      activePlayerId
                    ) {
                      handleSitInternal(idx);
                    }
                  }}
                />
              );
            })}
        </div>

        {playersAtTable.includes(activePlayerId) && (
          <div className="d-flex mt-3 border border-black justify-content-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLeaveTable}
            >
              Leave Table
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameTable;
