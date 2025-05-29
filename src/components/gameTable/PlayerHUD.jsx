import { useState } from "react";
import { createAvatar } from "@dicebear/avatars";
import * as identiconSprites from "@dicebear/avatars-identicon-sprites";
import PlayerBets from "./PlayerBets";
const HUD_CONFIG = {
  widthPercent: 30,
  heightPercent: 25,
};

const CARD_BACK_URL = "https://deckofcardsapi.com/static/img/back.png";
const CHIP_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Poker_chip_red.svg/40px-Poker_chip_red.svg.png";

const PlayerHUD = ({
  playerId,
  playerObj,
  seat,
  onClick,
  seatIndex,
  seatCount,
  currentBet,
  isDealer,
  gameState,
  isCurrentTurn,
  stack,
  holeCards,
}) => {
  //const [isDealer, setIsDealer] = useState(true);

  const profilePic =
    playerObj?.picture ||
    createAvatar(identiconSprites, {
      seed: playerId || "default",
      dataUri: true,
    });

  const displayName =
    playerObj?.display_name ||
    playerObj?.name ||
    (playerId ? playerId.slice(0, 6) : "<Seat Empty>");

  return (
    <div
      style={{
        position: "absolute",
        top: `${seat.top}%`,
        left: `${seat.left}%`,
        width: `${HUD_CONFIG.widthPercent}%`,
        height: `${HUD_CONFIG.heightPercent}%`,
        transform: "translate(-50%, -50%)",
      }}
      onClick={onClick}
    >
      {/* Hole cards behind HUD */}
      {playerId && (
        <div
          style={{
            position: "absolute",
            top: "-34%", // position above HUD
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "4px",
            zIndex: 0,
          }}
        >
          {Array.isArray(holeCards) &&
            holeCards.map((card, i) =>
              card ? (
                <img
                  key={i}
                  src={card.src}
                  alt={card.id}
                  style={{ width: 40 }}
                />
              ) : (
                <img
                  key={i}
                  src={CARD_BACK_URL}
                  alt="Card Back"
                  style={{ width: 40 }}
                />
              )
            )}
        </div>
      )}

      {/* HUD foreground */}
      <div
        className="seat"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4%",
          boxSizing: "border-box",
          gap: "4%",
          backgroundColor: "white",
          border: isCurrentTurn ? "3px solid #007bff" : "1px solid black",
          borderRadius: "0.5rem",
          zIndex: 1,
          position: "relative",
        }}
      >
        {/* Left: Avatar */}
        <div
          style={{
            width: "30%",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            overflow: "hidden",
            border: "1px solid black",
            flexShrink: 0,
          }}
        >
          <img
            src={profilePic}
            alt="avatar"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>

        {/* Right: Info column */}
        <div
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: "clamp(0.6rem, 1.5vw, 1.5rem)",
              width: "100%",
              textAlign: "left",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayName}
          </span>

          <div
            style={{
              marginTop: "6%",
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {playerId && typeof stack === "number" && (
              <span
                style={{
                  fontSize: "clamp(0.5rem, 1vw, 1rem)",
                  color: "#28a745",
                  fontWeight: "bold",
                }}
              >
                ${stack}
              </span>
            )}

            {playerId && isDealer && (
              <div
                style={{
                  fontSize: "0.35rem",
                  padding: "2px 6px",
                  backgroundColor: "#ffc107",
                  color: "#212529",
                  borderRadius: "0.3rem",
                  fontWeight: "bold",
                }}
              >
                D
              </div>
            )}
            {currentBet > 0 && (
              <PlayerBets
                seatIndex={seatIndex}
                totalSeats={seatCount}
                amount={currentBet}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerHUD;
