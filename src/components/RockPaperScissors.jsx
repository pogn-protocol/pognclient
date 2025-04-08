import React, { useEffect, useState } from "react";
import { JsonView } from "react-json-view-lite";

const RockPaperScissors = ({
  sendGameMessage,
  playerId,
  gameState,
  gameId,
}) => {
  const [localGameState, setLocalGameState] = useState({
    gameStatus: "waiting",
    winner: null,
    loser: null,
    choices: {},
    draw: false,
  });

  const [pendingChoice, setPendingChoice] = useState(null);

  useEffect(() => {
    if (!gameState || !gameState.gameAction) return;
    console.log("gameState.gameAction fired", gameState);
    switch (gameState.gameAction) {
      case "waiting":
      case "results":
        setLocalGameState(
          (prev) => (
            console.log("results", gameState),
            {
              ...prev,
              ...gameState,
            }
          )
        );
        break;

      case "draw":
        setLocalGameState(
          (prev) => (
            console.log("draw", gameState),
            {
              ...prev,
              ...gameState,
            }
          )
        );
        setPendingChoice(null); // clear pending when server acknowledges
        break;
      default:
        break;
    }
  }, [gameState]);

  const makeChoice = (choice) => {
    setPendingChoice(choice);
    sendGameMessage({
      payload: {
        type: "game",
        action: "gameAction",
        gameType: "rock-paper-scissors",
        gameAction: choice,
        playerId,
        gameId,
      },
    });
  };

  const currentChoice = localGameState.choices[playerId] || pendingChoice;

  return (
    <div className="flex flex-col justify-center items-center gap-4 mt-4">
      {/* <div className="text-sm text-black-300 break-words max-w-full">
        {Object.entries(localGameState).map(([key, value]) => (
          <div key={key}>
            <strong>{key}:</strong>{" "}
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </div>
        ))}
      </div> */}

      {/* --- CHOICE BUTTON OR SELECTED CHOICE --- */}
      <div className="flex justify-center gap-4">
        {currentChoice ? (
          <button
            className="ring-4 ring-yellow-400 text-white font-semibold py-2 px-4 rounded shadow cursor-default bg-gray-600"
            disabled
          >
            {currentChoice === "rock" && "✊ Rock"}
            {currentChoice === "paper" && "✋ Paper"}
            {currentChoice === "scissors" && "✌️ Scissors"}
          </button>
        ) : (
          ["rock", "paper", "scissors"].map((choice) => {
            const baseColor =
              choice === "rock" ? "red" : choice === "paper" ? "green" : "blue";

            return (
              <button
                key={choice}
                onClick={() => makeChoice(choice)}
                className={`bg-${baseColor}-500 hover:bg-${baseColor}-600 text-white font-semibold py-2 px-4 rounded shadow`}
              >
                {choice === "rock" && "✊ Rock"}
                {choice === "paper" && "✋ Paper"}
                {choice === "scissors" && "✌️ Scissors"}
              </button>
            );
          })
        )}
      </div>
      {/* --- WINNER/LOSER --- */}
      {console.log("localGameState", localGameState)}
      {localGameState.gameStatus === "complete" && (
        <div className="text-center mt-4 space-y-2 break-words max-w-full">
          {localGameState.draw ? (
            <p className="text-yellow-500 font-bold text-lg">It's a draw!</p>
          ) : (
            <>
              <p className="text-green-500 font-bold text-lg">
                Winner:{" "}
                {localGameState.winner === playerId
                  ? "You"
                  : localGameState.winner}
              </p>
              <p className="text-red-500 font-medium">
                Loser:{" "}
                {localGameState.loser === playerId
                  ? "You"
                  : localGameState.loser}
              </p>
            </>
          )}

          {/* --- CHOICES --- */}
          <div className="mt-2">
            <h4 className="font-semibold text-white">Choices:</h4>
            <ul className="text-sm text-black-300">
              {Object.entries(localGameState.choices || {}).map(
                ([id, choice]) => (
                  <li key={id}>
                    {id === playerId ? "You" : id}: {choice}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      )}

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

export default RockPaperScissors;
