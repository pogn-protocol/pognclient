import React from "react";
import Ranker from "handranker";

const PlayerControls = ({
  activePlayerId,
  gameState,
  playerStacks,
  currentTurnPlayerId,
  betAmount,
  minBet,
  smallBlind,
  setBetAmount,
  sendMessage,
  playersAtTable,
  holeCards = [],
}) => {
  const isActiveTurn = currentTurnPlayerId === activePlayerId;
  const isSeated = playersAtTable.some((p) => p?.playerId === activePlayerId);

  const handleSliderChange = (e) => {
    setBetAmount(Number(e.target.value));
  };

  const handleInputChange = (e) => {
    setBetAmount(Number(e.target.value));
  };

  const getPlayerHandRank = () => {
    if (!holeCards?.length) return null;

    console.log("🔍 Calculating player hand rank...");
    const board = gameState.communityCards || [];
    console.log("🃏 Board cards:", board);
    console.log("🕳️ Hole cards:", holeCards);

    const toRankerFormat = (card) => {
      if (!card) return null;

      if (typeof card === "string") {
        console.log("Board card as string:", card);
        return card.length === 2 ? card : null;
      }

      if (!card.value || !card.suit) return null;

      const rank = card.value === "0" ? "T" : card.value.toUpperCase();
      const suit = card.suit.toLowerCase();
      const formatted = rank + suit;
      console.log("Formatted hole card:", formatted);
      return formatted;
    };

    const cards = [...holeCards, ...board].map(toRankerFormat).filter(Boolean);

    console.log("🎯 Cards to rank:", cards);

    if (cards.length < 5) {
      console.warn(
        "❗ Not enough cards to evaluate. Needed 5, got:",
        cards.length
      );
      return null;
    }

    try {
      const result = Ranker.getHand(cards);
      console.log("✅ Hand rank result:", result);
      return result?.description || null;
    } catch (err) {
      console.error("❌ Ranker failed on cards:", cards, err);
      return null;
    }
  };

  if (!isSeated || !gameState.players?.[activePlayerId]) return null;

  return (
    <div className="w-50 d-flex mt-5 flex-column justify-content-end">
      {getPlayerHandRank() && (
        <div className="text-center my-3">
          <span className="badge bg-success">
            You have: {getPlayerHandRank()}
          </span>
        </div>
      )}

      <div className="w-100 mb-2 d-flex align-items-center gap-2">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() =>
            setBetAmount((prev) => Math.max(minBet, prev - smallBlind))
          }
          disabled={!isActiveTurn}
        >
          –
        </button>
        <input
          type="number"
          className="form-control"
          min={minBet}
          max={playerStacks[activePlayerId] || minBet}
          step={smallBlind}
          value={betAmount}
          onChange={handleInputChange}
          disabled={!isActiveTurn}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() =>
            setBetAmount((prev) => Math.min(1000, prev + smallBlind))
          }
          disabled={!isActiveTurn}
        >
          +
        </button>
      </div>

      <div
        className="btn-group mb-2 w-100 gap-2"
        role="group"
        aria-label="Action Buttons"
      >
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!isActiveTurn}
          onClick={() =>
            sendMessage("displayGame", {
              relayId: "displayGame",
              payload: {
                type: "displayGame",
                action: "gameAction",
                gameAction: "fold",
                playerId: activePlayerId,
                gameId: "displayGame",
              },
            })
          }
        >
          Fold
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!isActiveTurn}
          onClick={() =>
            sendMessage("displayGame", {
              relayId: "displayGame",
              payload: {
                type: "displayGame",
                action: "gameAction",
                gameAction: "check",
                playerId: activePlayerId,
                gameId: "displayGame",
              },
            })
          }
        >
          Check
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!isActiveTurn}
          onClick={() =>
            sendMessage("displayGame", {
              relayId: "displayGame",
              payload: {
                type: "displayGame",
                action: "gameAction",
                gameAction: "bet",
                playerId: activePlayerId,
                gameId: "displayGame",
                gameActionParams: {
                  amount: betAmount,
                },
              },
            })
          }
        >
          Bet {betAmount}
        </button>
      </div>

      <div className="w-100 mb-2">
        <input
          type="range"
          className="form-range"
          min={minBet}
          max={playerStacks[activePlayerId] || minBet}
          step={smallBlind}
          value={betAmount}
          onChange={handleSliderChange}
        />
      </div>
    </div>
  );
};

export default PlayerControls;
