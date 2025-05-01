import React, { useState } from "react";

const TicTacToe = ({ sendGameMessage, playerId, gameState, gameId }) => {
  const [isGameStarted, setGameStarted] = React.useState(false);
  const [isPlayerReady, setPlayerReady] = React.useState(false);

  console.log("[GameComponent] render — playerId:", playerId);
  console.log("[GameComponent] gameState:", gameState);
  console.log("[GameComponent] gameAction:", gameState?.gameAction);

  React.useEffect(() => {
    if (!isGameStarted && gameState?.gameAction === "gameStarted") {
      console.log("[GameComponent] Setting isGameStarted = true");
      setGameStarted(true);
      setPlayerReady(true); // lock this too, if needed
    }

    if (!isPlayerReady && gameState?.gameAction === "playerReady") {
      const readyStates = gameState?.readyStates || {};
      if (readyStates[playerId]) {
        console.log("[GameComponent] Setting isPlayerReady = true");
        setPlayerReady(true);
      }
    }
  }, [gameState?.gameAction]);

  const currentPlayer = playerId;
  const board = gameState?.board || Array(9).fill(null);
  const currentTurn = gameState?.currentTurn;
  const winner = gameState?.winner;
  const message = gameState?.message;
  const roles = gameState?.roles || {};

  console.log("[GameComponent] isGameStarted:", isGameStarted);
  console.log("[GameComponent] isPlayerReady:", isPlayerReady);
  console.log("[GameComponent] board:", board);
  console.log("[GameComponent] currentTurn:", currentTurn);
  console.log("[GameComponent] winner:", winner);

  const handleClick = (index) => {
    if (board[index]) {
      console.log("[handleClick] Cell already taken at index:", index);
      return;
    }
    if (winner) {
      console.log("[handleClick] Game already has winner:", winner);
      return;
    }
    if (currentTurn !== currentPlayer) {
      console.log("[handleClick] Not your turn.");
      return;
    }

    console.log("[handleClick] Sending move:", index);
    sendGameMessage({
      gameAction: "makeMove",
      playerId,
      gameId,
      gameActionParams: {
        index,
      },
    });
  };

  const handleReady = () => {
    console.log("[handleReady] Player clicked ready:", playerId);
    sendGameMessage({
      gameAction: "playerReady",
      playerId,
      gameId,
    });
  };

  return (
    <div className="space-y-4">
      <p className="font-bold text-lg text-blue-700">🎯 Player {playerId}</p>

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
          <p className="text-sm">
            Current Turn:{" "}
            <span className="font-bold text-indigo-600">{currentTurn}</span>
          </p>
          {winner && (
            <p className="text-green-600 font-semibold">
              🏆 Winner: Player {winner}
            </p>
          )}
          {message && <p className="text-sm text-gray-500 italic">{message}</p>}
          <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
            {board.map((cell, i) => (
              <button
                key={i}
                onClick={() => handleClick(i)}
                className="w-12 h-12 text-xl font-bold border border-gray-400 rounded bg-white"
              >
                {cell}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TicTacToe;
