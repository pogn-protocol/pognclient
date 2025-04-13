import React, { useState, useEffect } from "react";
import {
  useLocalGameState,
  GameResultDisplay,
  GameJsonDebug,
} from "../utils/gameUtils";

const RockPaperScissors = ({
  sendGameMessage,
  playerId,
  gameState,
  gameId,
}) => {
  const [localGameState, setLocalGameState] = useLocalGameState(
    gameId,
    gameState
  );
  const [pendingChoice, setPendingChoice] = useState(null);

  const currentChoice = localGameState.choices?.[playerId] || pendingChoice;

  const makeChoice = (choice) => {
    setPendingChoice(choice);
    sendGameMessage({
      payload: {
        type: "game",
        action: "gameAction",
        gameAction: choice,
        playerId,
        gameId,
      },
    });
  };

  useEffect(() => {
    if (!gameState?.gameAction) return;

    switch (gameState.gameAction) {
      case "results":
      case "draw":
        setPendingChoice(null);
        break;
      default:
        break;
    }
  }, [gameState?.gameAction]);

  return (
    <div className="flex flex-col justify-center items-center gap-4 mt-4">
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
          ["rock", "paper", "scissors"].map((choice) => (
            <button
              key={choice}
              onClick={() => makeChoice(choice)}
              className={`bg-${
                choice === "rock"
                  ? "red"
                  : choice === "paper"
                  ? "green"
                  : "blue"
              }-500 hover:bg-${
                choice === "rock"
                  ? "red"
                  : choice === "paper"
                  ? "green"
                  : "blue"
              }-600 text-white font-semibold py-2 px-4 rounded shadow`}
            >
              {choice === "rock" && "✊ Rock"}
              {choice === "paper" && "✋ Paper"}
              {choice === "scissors" && "✌️ Scissors"}
            </button>
          ))
        )}
      </div>

      {localGameState.gameStatus === "complete" && (
        <div className="text-center mt-4 space-y-2 break-words max-w-full">
          <GameResultDisplay
            localGameState={localGameState}
            playerId={playerId}
          />
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

      <GameJsonDebug localGameState={localGameState} rawState={gameState} />
    </div>
  );
};

export default RockPaperScissors;
