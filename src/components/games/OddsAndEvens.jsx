import React, { useState } from "react";

function OddsAndEvens({ sendGameMessage, gameState, playerId, gameId }) {
  //
  const [isGameStarted, setGameStarted] = React.useState(false);
  const [isPlayerReady, setPlayerReady] = React.useState(false);
  const [selectedNumber, setSelectedNumber] = React.useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = React.useState(false);
  const [opponentChose, setOpponentChose] = React.useState(false);

  console.log("[GameComponent] render — playerId:", playerId);
  console.log("[GameComponent] gameState:", gameState);

  React.useEffect(() => {
    if (!isGameStarted && gameState?.gameAction === "gameStarted") {
      console.log("[GameComponent] Setting isGameStarted = true");
      setGameStarted(true);
      setPlayerReady(true);
      setOpponentChose(false);
    }

    if (!isPlayerReady && gameState?.gameAction === "playerReady") {
      const readyStates = gameState?.readyStates || {};
      if (readyStates[playerId]) {
        console.log("[GameComponent] Setting isPlayerReady = true");
        setPlayerReady(true);
      }
    }

    // if (gameState?.gameAction === "numberChosen") {
    //   if (gameState?.playerId === playerId) {
    //     setWaitingForOpponent(true);
    //   } else {
    //     setOpponentChose(true);
    //   }
    // }

    if (gameState?.gameAction === "numberChosen") {
      console.log("[GameComponent] number Choice");
      if (gameState?.playerId === playerId) {
        console.log("[GameComponent] Setting waitingForOpponent = true");
        setWaitingForOpponent(true);
      } else {
        console.log("[GameComponent] Setting opponentChose = true");
        setOpponentChose(true);
      }
    }

    if (gameState?.gameAction === "roundCompleted") {
      setSelectedNumber(null);
      setWaitingForOpponent(false);
      setOpponentChose(false);
    }
  }, [gameState?.gameAction]);

  const handleReady = () => {
    console.log("[handleReady] Player clicked ready:", playerId);
    sendGameMessage({
      gameAction: "playerReady",
      playerId,
      gameId,
    });
  };

  const handleNumberSelection = (number) => {
    if (waitingForOpponent) return;

    console.log("[handleNumberSelection] Player selected:", number);
    setSelectedNumber(number);

    sendGameMessage({
      gameAction: "chooseNumber",
      playerId,
      gameId,
      gameActionParams: {
        number,
      },
    });
  };

  // Get game data from gameState
  const roles = gameState?.roles || {};
  const currentRound = gameState?.round || "NaN";
  const maxRounds = gameState?.rounds || "NaN";
  const scores = gameState?.scores || {};
  const gameStatus = gameState?.gameStatus;
  const winner = gameState?.winner;
  const message = gameState?.message;
  const yourRole = roles[playerId];
  const yourChoice = gameState?.private?.yourChoice;
  const lastRoundResult = gameState?.lastRoundResult;

  // Find opponent ID and choice
  const opponentId = Object.keys(roles).find((id) => id !== playerId);
  const opponentChoice = lastRoundResult?.choices?.[opponentId] ?? null;

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg shadow">
      <div className="flex justify-between items-center">
        <p className="font-bold text-lg text-blue-700">Player {playerId}</p>
        {yourRole && (
          <p className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            You are: {yourRole === "odds" ? "ODDS 🎲" : "EVENS 🎯"}
          </p>
        )}
      </div>

      {!isGameStarted ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 italic">
            Waiting for all players to be ready...
          </p>
          {!isPlayerReady ? (
            <button
              onClick={handleReady}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              ✅ Ready
            </button>
          ) : (
            <p className="text-green-600 font-semibold">✅ You are ready</p>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">
              Round: <span className="text-indigo-600">{currentRound}</span> of{" "}
              {maxRounds}
            </div>
            <div className="text-sm font-medium">
              {Object.entries(scores).map(([id, score]) => (
                <span
                  key={id}
                  className={`px-2 ${
                    id === playerId
                      ? "text-blue-600 font-bold"
                      : "text-gray-600"
                  }`}
                >
                  {id}: {score}
                </span>
              ))}
            </div>
          </div>

          {message && (
            <div className="bg-gray-100 p-3 rounded text-sm text-gray-700 italic">
              {message}
            </div>
          )}

          {lastRoundResult && (
            <div className="bg-blue-50 p-3 rounded text-sm">
              <p className="font-medium">
                Round {lastRoundResult.round} Result:
              </p>
              <p>
                {Object.entries(lastRoundResult.choices).map(([id, choice]) => (
                  <span key={id} className="pr-2">
                    {id === playerId ? "You" : "Opponent"}: {choice}
                  </span>
                ))}
              </p>
              <p>
                Sum: {lastRoundResult.sum} (
                {lastRoundResult.isOdd ? "Odd" : "Even"})
              </p>
              <p>
                Winner:{" "}
                {lastRoundResult.roundWinner === playerId
                  ? "You!"
                  : lastRoundResult.roundWinner === null
                  ? "Draw"
                  : "Opponent"}
              </p>
            </div>
          )}

          {gameStatus === "complete" && (
            <div
              className={`p-4 rounded-lg text-center font-bold text-lg ${
                winner === playerId
                  ? "bg-green-100 text-green-800"
                  : winner === "draw"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {winner === playerId
                ? "🏆 You Won!"
                : winner === "draw"
                ? "🤝 Game Ended in a Draw!"
                : "😢 You Lost!"}
            </div>
          )}

          {gameStatus !== "complete" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {!yourChoice
                  ? "Choose a number (1-5):"
                  : !opponentChose
                  ? `Waiting for opponent... (You chose: ${yourChoice})`
                  : `Both players chose. You: ${yourChoice}, Opponent: ${opponentChoice}`}
              </p>

              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberSelection(num)}
                    disabled={waitingForOpponent}
                    className={`w-10 h-10 rounded-full text-lg font-bold 
                      ${
                        selectedNumber === num
                          ? "bg-blue-600 text-white"
                          : waitingForOpponent
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-white border border-blue-400 hover:bg-blue-100 text-blue-600"
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default OddsAndEvens;
