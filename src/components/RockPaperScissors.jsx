import React, { useState, useEffect } from "react";

const RockPaperScissors = ({
  sendGameMessage,
  playerId,
  gameState,
  gameId,
}) => {
  const [isGameStarted, setGameStarted] = React.useState(false);
  const [isPlayerReady, setPlayerReady] = React.useState(false);

  React.useEffect(() => {
    if (gameState?.gameAction === "gameStarted") {
      setGameStarted(true);
      setPlayerReady(true);
    }
  }, [gameState?.gameAction]);

  const roles = gameState?.roles || {};
  const yourChoice = gameState?.private?.yourChoice || null;
  const opponentId = Object.keys(roles).find((id) => id !== playerId);
  const gameAction = gameState?.gameAction;
  const opponentHasChosen = gameAction === "playerChose" && yourChoice === null;

  const round = gameState?.round ?? "N/A";
  const rounds = gameState?.rounds ?? "∞";
  const winner = gameState?.winner;
  const message = gameState?.message;
  const gameStatus = gameState?.gameStatus;

  const handlePlay = (choice) => {
    if (yourChoice || gameStatus === "complete") return;
    sendGameMessage({
      gameAction: choice,
      playerId,
      gameId,
    });
  };

  const handleReady = () => {
    sendGameMessage({
      gameAction: "playerReady",
      playerId,
      gameId,
    });
  };

  const renderGameStatus = () => {
    if (yourChoice && gameAction === "playerChose") {
      return `You chose ${yourChoice}. Waiting for opponent...`;
    }
    if (!yourChoice && opponentHasChosen) {
      return `Opponent has chosen. Waiting for your move.`;
    }
    return "Choose rock, paper, or scissors.";
  };

  return (
    <div className="space-y-4 p-4 bg-gray-100 rounded shadow">
      {typeof round === "number" && (
        <div className="flex justify-between">
          <p className="font-bold text-lg text-blue-700">Player {playerId}</p>
          <p className="text-sm text-gray-500">
            Round: <span className="text-indigo-600">{round}</span> of {rounds}
          </p>
        </div>
      )}

      {!isGameStarted ? (
        <div className="space-y-2">
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
          {message && (
            <div className="bg-white border p-3 rounded text-sm text-gray-700 italic">
              {message}
            </div>
          )}

          <div className="text-sm font-medium text-gray-700">
            {renderGameStatus()}
          </div>

          <div className="flex justify-center gap-3">
            {["rock", "paper", "scissors"].map((choice) => {
              const isSelected = yourChoice === choice;

              let colorClasses = "";
              if (isSelected) {
                colorClasses = "bg-yellow-500";
              } else if (choice === "rock") {
                colorClasses = "bg-blue-500 hover:bg-blue-600";
              } else if (choice === "paper") {
                colorClasses = "bg-green-500 hover:bg-green-600";
              } else if (choice === "scissors") {
                colorClasses = "bg-red-500 hover:bg-red-600";
              }

              return (
                <button
                  key={choice}
                  onClick={() => handlePlay(choice)}
                  disabled={!!yourChoice || gameStatus === "complete"}
                  className={`px-4 py-2 rounded font-bold text-white shadow ${colorClasses}`}
                >
                  {choice === "rock" && "✊ Rock"}
                  {choice === "paper" && "✋ Paper"}
                  {choice === "scissors" && "✌️ Scissors"}
                </button>
              );
            })}
          </div>

          {gameStatus === "complete" && (
            <div
              className={`mt-4 p-4 rounded text-center font-bold text-lg ${
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
                ? "🤝 It's a draw!"
                : "😢 You Lost!"}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RockPaperScissors;
