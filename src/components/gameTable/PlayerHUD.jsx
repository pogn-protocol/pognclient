import { useState } from "react";
import { createAvatar } from "@dicebear/avatars";
import * as identiconSprites from "@dicebear/avatars-identicon-sprites";

const HUD_CONFIG = {
  widthPercent: 35,
  heightPercent: 25,
};

const PlayerHUD = ({ playerId, playerObj, seat, onClick }) => {
  const [isDealer, setIsDealer] = useState(true);

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
      className="seat"
      style={{
        position: "absolute",
        top: `${seat.top}%`,
        left: `${seat.left}%`,
        width: `${HUD_CONFIG.widthPercent}%`,
        height: `${HUD_CONFIG.heightPercent}%`,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 0,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
      onClick={onClick}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "4%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "4%",
        }}
      >
        {/* Left: Avatar */}
        <div
          style={{
            width: "25%",
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

          {/* Points + Dealer */}
          <div
            style={{
              marginTop: "6%",
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Points */}
            {playerId && (
              <span
                style={{
                  fontSize: "clamp(0.5rem, 1vw, 1rem)",
                  color: "#28a745",
                  fontWeight: "bold",
                }}
              >
                5,000
              </span>
            )}

            {/* Dealer button */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerHUD;
