import PlayerHUD from "./PlayerHUD";
import "./gameTable.css";

const GameTable = ({
  tableRef,
  seatCount,
  tableSize,
  CONFIG,
  gameState,
  playersAtTable,
  playerStacks,
  playerHands,
  playerChatMessages,
  currentTurnPlayerId,
  winnerOverlayId,
  activePlayerId,
  handleSit,
}) => {
  const { width, height } = tableSize;
  const cx = width / 2;
  const cy = height / 2;
  const radiusX = width / 2;
  const radiusY = height / 2;
  const seatOffsetX = radiusX * CONFIG.seatPaddingRatio;
  const seatOffsetY = radiusY * CONFIG.seatPaddingRatio;

  const dealerId =
    typeof gameState.buttonIndex === "number" &&
    playersAtTable.length > gameState.buttonIndex
      ? playersAtTable[gameState.buttonIndex]?.playerId
      : null;

  function parseCard(code) {
    if (!code || typeof code !== "string") return null;

    if (code === "X") {
      return {
        id: "X",
        src: "https://deckofcardsapi.com/static/img/back.png",
        value: "X",
        suit: "X",
        isFaceDown: true,
      };
    }

    const value = code[0] === "T" ? "0" : code[0];
    const suit = code[1].toUpperCase();

    return {
      id: code,
      src: `https://deckofcardsapi.com/static/img/${value}${suit}.png`,
      value,
      suit,
      isFaceDown: false,
    };
  }

  return (
    <div
      ref={tableRef}
      className="gameTableDiv position-relative my-5 px-4"
      style={{
        width: "85%",
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
          ♠ POGN ♣
        </div>

        <div
          style={{
            position: "absolute",
            top: "9%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "2vw",
            fontWeight: 700,
          }}
        >
          Pot: ${gameState.pot || 0}
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
          {gameState.communityCards.map((code, i) => {
            const card = parseCard(code);
            return (
              <img
                key={i}
                src={card.src}
                alt={card.id}
                style={{
                  width: "clamp(30px, 7vw, 60px)",
                  height: "auto",
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>
      </div>

      {Array(seatCount)
        .fill(null)
        .map((_, idx) => {
          const angle = (2 * Math.PI * idx) / seatCount - Math.PI / 2;
          const x = cx + (radiusX + seatOffsetX) * Math.cos(angle);
          const y = cy + (radiusY + seatOffsetY) * Math.sin(angle);
          const playerObj = playersAtTable[idx];
          const playerId = playerObj?.playerId;

          return (
            <PlayerHUD
              key={idx}
              seatIndex={idx}
              seatCount={seatCount}
              playerId={playerId}
              playerObj={playerObj}
              currentBet={gameState?.players?.[playerId]?.bet || 0}
              isDealer={playerId === dealerId}
              seat={{
                top: (y / height) * 100,
                left: (x / width) * 100,
              }}
              onClick={() => {
                if (
                  !playerId ||
                  playerId === activePlayerId ||
                  !activePlayerId
                ) {
                  handleSit(idx);
                }
              }}
              gameState={gameState}
              isCurrentTurn={playerId === currentTurnPlayerId}
              stack={playerStacks[playerId] || 0}
              holeCards={
                Array.isArray(playerHands[playerId])
                  ? playerHands[playerId]
                  : []
              }
              isWinner={playerId && playerId === winnerOverlayId}
              chatMessage={playerChatMessages[playerId]?.text}
            />
          );
        })}
    </div>
  );
};

export default GameTable;
