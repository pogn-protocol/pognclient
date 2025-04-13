import React from "react";
import {
  useLocalGameState,
  useRoleRequester,
  GameResultDisplay,
  GameJsonDebug,
} from "../utils/gameUtils.jsx";

const TicTacToe = ({ sendGameMessage, playerId, gameState, gameId }) => {
  const [localGameState, setLocalGameState] = useLocalGameState(
    gameId,
    gameState
  );
  const role = useRoleRequester(
    localGameState,
    playerId,
    gameId,
    sendGameMessage
  );

  const handleCellClick = (index) => {
    console.log("Cell clicked:", index);
    console.log("Current game state:", localGameState);
    console.log("Current player ID:", playerId);
    console.log("Current role:", role);
    console.log("Current game ID:", gameId);
    if (localGameState.gameStatus !== "in-progress") return;
    // if (localGameState.currentTurn !== playerId) return;
    if (localGameState.currentTurn !== playerId) return;

    if (localGameState.board?.[index] !== null) return;

    sendGameMessage({
      payload: {
        type: "game",
        action: "gameAction",
        gameAction: "makeMove",
        playerId,
        gameId,
        index,
      },
    });
  };

  return (
    <div className="p-4 border rounded shadow-md w-full max-w-4xl mx-auto space-y-3">
      <h5 className="text-lg font-bold">Tic Tac Toe</h5>

      <p>
        <strong>Game ID:</strong> {gameId}
      </p>
      <p>
        <strong>Your Role:</strong> {role || "Loading..."}
      </p>
      <p>
        <strong>Current Turn:</strong>{" "}
        {localGameState.roles?.[localGameState.currentTurn] || "..."}
      </p>

      <div className="grid grid-cols-3 gap-1 max-w-xs mx-auto">
        {(localGameState.board || Array(9).fill(null)).map((cell, index) => (
          <button
            key={index}
            className="w-20 h-20 text-2xl font-bold border rounded hover:bg-gray-100"
            onClick={() => handleCellClick(index)}
            disabled={
              cell !== null ||
              localGameState.currentTurn !== playerId ||
              localGameState.gameStatus !== "in-progress"
            }
          >
            {cell}
          </button>
        ))}
      </div>

      <GameResultDisplay localGameState={localGameState} playerId={playerId} />

      <button
        onClick={() =>
          sendGameMessage({
            payload: {
              type: "game",
              action: "endGame",
              playerId,
              gameId,
            },
          })
        }
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 mt-2"
      >
        End Game
      </button>

      <GameJsonDebug rawState={gameState} localGameState={localGameState} />
    </div>
  );
};

export default TicTacToe;
