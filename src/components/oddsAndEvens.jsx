import React, { useEffect, useState } from "react";
import { use } from "react";
import {
  JsonView,
  allExpanded,
  darkStyles,
  defaultStyles,
} from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

const OddsAndEvens = ({
  sendGameMessage,
  playerId,
  gameState,
  gameId,
  disconnectSelf,
}) => {
  const [role, setRole] = useState(null); // Player's assigned role
  const [number, setNumber] = useState(""); // Player's chosen number
  const [localGameState, setLocalGameState] = useState({
    gameId: gameId,
    gameStatus: null,
    action: null,
    winner: null,
    sum: null,
    roles: {}, // Store the roles assigned by the server
    numbers: {}, // Track submitted numbers
    initialized: false,
  });

  useEffect(() => {
    console.log("Warning gameId changed", gameId);
  }, [gameId]);

  /**
   * Updates local game state when the game state changes.
   */
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

  /**
   * Initializes the game by fetching roles if not already assigned.
   */
  useEffect(() => {
    // If the game state is not initialized, fetch roles.
    if (!localGameState.initialized) {
      console.log(
        `${gameId} Roles not assigned yet. Fetching from the relay...`
      );
      setLocalGameState((prev) => ({
        ...prev,
        initialized: true, // Mark as initialized to prevent re-triggering
      }));
      sendGameMessage({
        payload: {
          type: "game",
          action: "gameAction",
          gameAction: "getRoles",
          playerId,
          gameId: gameId,
        },
      });

      return;
    }

    if (!localGameState || !localGameState.gameAction) return;

    console.log("gameState.gameAction fired", localGameState);

    switch (localGameState?.gameAction) {
      case "rolesAssigned":
        console.log(gameId, "Roles assigned:", localGameState.roles);
        setRole(localGameState.roles[playerId]);
        setLocalGameState((prev) => ({
          ...prev,
          gameStatus: localGameState.gameStatus,
          roles: localGameState.roles,
          initialized: true,
          action: null,
        }));
        break;

      case "waitingForOpponent":
        console.log("Waiting for the other player...");
        setLocalGameState((prev) => ({
          ...prev,
          action: null,
        }));
        break;

      case "results":
        setLocalGameState((prev) => ({
          ...prev,
          gameStatus: localGameState.gameStatus,
          winner: localGameState.winner,
          sum: localGameState.sum,
          roles: localGameState.roles,
          numbers: localGameState.numbers,
          action: null,
        }));
        console.log("Game results received.");
        break;

      default:
        console.warn(
          `Unhandled action: ${
            localGameState?.gameAction
          } with message: ${JSON.stringify(localGameState)}`
        );
    }
  }, [
    localGameState.gameAction,
    localGameState.roles,
    gameId,
    playerId,
    sendGameMessage,
  ]);

  /**
   * Handle number submission.
   */
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

    setNumber(""); // Clear the input after submission
  };

  return (
    // <div>
    //   <h5>Odds and Evens Game</h5>
    //   <p>Game ID: {gameId}</p>
    //   <p>Role: {role || "Unknown"}</p>
    //   <p>Number: {number || "None"}</p>
    //   <input
    //     type="number"
    //     value={number}
    //     onChange={(e) => setNumber(e.target.value)}
    //     placeholder="Enter a number"
    //   />
    //   <button onClick={handleNumberSubmit}>Submit Number</button>
    //   <div className="jsonMessage">
    //     <JsonView
    //       data={localGameState}
    //       shouldExpandNode={(level) => level === 0}
    //       style={{ fontSize: "14px", lineHeight: "1.2" }}
    //     />
    //   </div>
    //   <button
    //     onClick={() =>
    //       sendGameMessage({
    //         payload: {
    //           type: "game",
    //           action: "endGame",
    //           playerId,
    //           gameId: gameId,
    //         },
    //       })
    //     }
    //   >
    //     Kill Game
    //   </button>
    // </div>
    <div className="p-4 border rounded shadow-md max-w-md mx-auto space-y-3">
      <h5 className="text-lg font-bold">Odds and Evens</h5>
      <p>
        <strong>Game ID:</strong> {gameId}
      </p>
      <p>
        <strong>Your Role:</strong> {role || "Loading..."}
      </p>

      <input
        type="number"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        placeholder="Enter a number"
        className="border rounded px-2 py-1 w-full"
      />
      <button
        onClick={handleNumberSubmit}
        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
      >
        Submit Number
      </button>

      <div className="jsonMessage border rounded p-2 bg-gray-100">
        <JsonView
          data={localGameState}
          shouldExpandNode={(level) => level === 0}
          style={{ fontSize: "14px", lineHeight: "1.2" }}
        />
      </div>

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
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
      >
        Kill Game
      </button>
    </div>
  );
};

export default OddsAndEvens;
