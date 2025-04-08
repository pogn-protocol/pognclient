import React, { useEffect, useState } from "react";
import { use } from "react";
import {
  JsonView,
  allExpanded,
  darkStyles,
  defaultStyles,
} from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

const OddsAndEvens = ({ sendGameMessage, playerId, gameState, gameId }) => {
  const [roleRequested, setRoleRequested] = useState(false);
  const [role, setRole] = useState(null); // Player's assigned role
  const [number, setNumber] = useState(""); // Player's chosen number
  const [localGameState, setLocalGameState] = useState({
    gameId: gameId,
    gameStatus: null,
    winner: null,
    sum: null,
    roles: {}, // Store the roles assigned by the server
    numbers: {}, // Track submitted numbers
    initialized: false,
  });
  const [submittedNumber, setSubmittedNumber] = useState(null); // Track submitted number

  useEffect(() => {
    console.log("Warning gameId changed", gameId);
  }, [gameId]);

  useEffect(() => {
    console.log(`${gameId} gameState changed`, gameState);
    if (!gameState) {
      console.warn("No gameState received.");
      return;
    }
    setLocalGameState((prev) => ({
      ...prev,
      ...gameState,
    }));
  }, [gameState]);

  useEffect(() => {
    // Only trigger if roles aren't in the latest gameState
    if (role) return;
    if (roleRequested) return; // Prevent multiple requests
    setRoleRequested(true); // Set to true to prevent multiple requests
    const rolesMissing =
      !gameState?.roles || Object.keys(gameState.roles).length < 2;
    if (rolesMissing) {
      console.log(`${gameId} requesting roles...`);
      sendGameMessage({
        payload: {
          type: "game",
          action: "gameAction",
          gameAction: "getRoles",
          playerId,
          gameId,
        },
      });
    }
  }, [localGameState?.roles, gameId, playerId, sendGameMessage]);

  useEffect(() => {
    if (!gameState || !gameState.gameAction) return;

    // if (!localGameState.initialized) {
    //   console.log(
    //     `${gameId} Roles not assigned yet. Fetching from the relay...`
    //   );
    //   setLocalGameState((prev) => ({ ...prev, initialized: true }));
    //   sendGameMessage({
    //     payload: {
    //       type: "game",
    //       action: "gameAction",
    //       gameAction: "getRoles",
    //       playerId,
    //       gameId,
    //     },
    //   });
    //   return;
    // }

    switch (gameState.gameAction) {
      case "rolesAssigned":
        if (gameState.roles?.[playerId] && gameState.roles[playerId] !== role) {
          setRole(gameState.roles[playerId]);
          setLocalGameState((prev) => ({
            ...prev,
            roles: {
              ...prev.roles,
              [playerId]: gameState.roles[playerId],
            },
          }));
        }
        break;
      case "waitingForOpponent":
      case "results":
        break;
      default:
        console.warn(`Unhandled gameAction: ${gameState.gameAction}`);
    }

    setLocalGameState((prev) => ({
      ...prev,
      ...gameState,
    }));
  }, [gameState?.gameAction]); // ✅ only run when gameAction changes

  const handleNumberSubmit = () => {
    if (number.trim() === "" || isNaN(number)) {
      console.warn("Invalid number submission");
      return;
    }

    sendGameMessage({
      payload: {
        type: "game",
        action: "gameAction",
        gameAction: "submitNumber",
        playerId,
        gameId: gameId,
        number: parseInt(number, 10), // Ensure it's an integer
      },
    });
    setSubmittedNumber(parseInt(number, 10)); // Store the submitted number
    setNumber(""); // Clear the input after submission
  };

  return (
    <div className="p-4 border rounded shadow-md w-full max-w-4xl mx-auto space-y-3">
      <div>
        <h5 className="text-lg font-bold">Odds and Evens</h5>

        <p>
          <strong>Game ID:</strong> {gameId}
        </p>
        <p>
          <strong>Your Role:</strong> {role || "Loading..."}
        </p>

        {(localGameState.numbers?.[playerId] !== undefined ||
          submittedNumber !== null) && (
          <p className="text-sm text-blue-700 font-medium">
            You submitted:{" "}
            <strong>
              {localGameState.numbers[playerId] !== undefined
                ? localGameState.numbers[playerId]
                : submittedNumber}
            </strong>
          </p>
        )}

        {localGameState.gameStatus === "complete" && (
          <div className="bg-white rounded shadow p-3 space-y-2">
            <p className="text-green-600 font-bold">
              Winner:{" "}
              {localGameState.winner === playerId
                ? "You"
                : localGameState.winner}
            </p>
            <p className="text-red-500 font-medium">
              Loser:{" "}
              {localGameState.loser === playerId ? "You" : localGameState.loser}
            </p>
            <p className="text-gray-700">
              Sum of Numbers: <strong>{localGameState.sum}</strong>
            </p>
            <div>
              <p className="">Numbers Submitted:</p>
              <ul className="text-sm">
                {Object.entries(localGameState.numbers || {}).map(
                  ([id, num]) => (
                    <li key={id}>
                      {id === playerId ? "You" : id}: {num}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-3">
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Enter a number"
            className="border rounded px-2 py-1 w-full"
          />
          <button
            onClick={handleNumberSubmit}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mt-2 "
          >
            Submit Number
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
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 ms-2"
          >
            Kill Game
          </button>
        </div>
      </div>

      <div className="d-flex flex-row justify-content-center align-items-start w-100 gap-2 mt-3">
        <div className="jsonMessage border rounded p-2 bg-gray-100">
          GameState (input from gameConsole)
          <JsonView
            data={gameState}
            shouldExpandNode={(level) => level === 0}
            style={{ fontSize: "14px", lineHeight: "1.2" }}
          />
        </div>

        <div className="jsonMessage border rounded p-2 bg-gray-100 ">
          LocalState (Game Display)
          <JsonView
            data={localGameState}
            shouldExpandNode={(level) => level === 0}
            style={{ fontSize: "14px", lineHeight: "1.2" }}
          />
        </div>
      </div>
    </div>
  );
};

export default OddsAndEvens;
