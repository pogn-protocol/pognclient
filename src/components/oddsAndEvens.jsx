import React, { useState } from "react";
import {
  useLocalGameState,
  useRoleRequester,
  GameResultDisplay,
  GameJsonDebug,
} from "../utils/gameUtils";

const OddsAndEvens = ({ sendGameMessage, playerId, gameState, gameId }) => {
  const [localGameState] = useLocalGameState(gameId, gameState);
  const role = useRoleRequester(
    localGameState,
    playerId,
    gameId,
    sendGameMessage
  );
  const [number, setNumber] = useState("");
  const [submittedNumber, setSubmittedNumber] = useState(null);

  const handleNumberSubmit = () => {
    if (number.trim() === "" || isNaN(number)) return;

    sendGameMessage({
      payload: {
        type: "game",
        action: "gameAction",
        gameAction: "submitNumber",
        playerId,
        gameId,
        number: parseInt(number, 10),
      },
    });

    setSubmittedNumber(parseInt(number, 10));
    setNumber("");
  };

  return (
    <div className="p-4 border rounded shadow-md w-full max-w-4xl mx-auto space-y-4">
      <h5 className="text-lg font-bold">Odds and Evens</h5>

      <div className="space-y-1">
        <p>
          <strong>Game ID:</strong> {gameId}
        </p>
        <p>
          <strong>Your Role:</strong> {role || "Loading..."}
        </p>
        {(localGameState.numbers?.[playerId] !== undefined ||
          submittedNumber !== null) && (
          <p className="text-blue-700 font-medium">
            You submitted:{" "}
            <strong>
              {localGameState.numbers?.[playerId] ?? submittedNumber}
            </strong>
          </p>
        )}
      </div>

      <GameResultDisplay localGameState={localGameState} playerId={playerId} />

      {localGameState.gameStatus === "complete" && (
        <div className="bg-white border rounded shadow p-4">
          <p>
            <strong>Sum of Numbers:</strong> {localGameState.sum ?? "N/A"}
          </p>
          <p className="font-semibold">Numbers Submitted:</p>
          <ul className="list-disc list-inside text-sm">
            {Object.entries(localGameState.numbers || {}).map(([id, num]) => (
              <li key={id}>
                {id === playerId ? "You" : id}: {num}
              </li>
            ))}
          </ul>
        </div>
      )}

      {localGameState.gameStatus !== "complete" && (
        <div className="flex gap-4 items-center">
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Enter a number"
            className="border rounded px-3 py-1 w-60"
          />
          <button
            onClick={handleNumberSubmit}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          >
            Submit
          </button>
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
            className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
          >
            Kill Game
          </button>
        </div>
      )}

      <GameJsonDebug rawState={gameState} localGameState={localGameState} />
    </div>
  );
};

export default OddsAndEvens;
