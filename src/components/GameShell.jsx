import React from "react";
import {
  useLocalGameState,
  GameResultDisplay,
  GameJsonDebug,
} from "../utils/gameUtils";

const GameShell = ({ Component, sharedProps }) => {
  const { gameState, sentMessages, receivedMessages } = sharedProps;
  const lastSent = sentMessages?.[sentMessages.length - 1];
  const lastReceived = receivedMessages?.[receivedMessages.length - 1];
  // Optional: assign role if needed
  // const role = useRoleRequester(
  //   localGameState,
  //   sharedProps.playerId,
  //   sharedProps.gameId,
  //   sharedProps.sendGameMessage
  // );

  if (!sharedProps.gameState) {
    return (
      <div className="p-4 text-gray-500 italic">
        ⏳ Waiting for game state...
      </div>
    );
  }
  return (
    <>
      <Component
        {...sharedProps}
        gameState={sharedProps.gameState}
        useLocalGameState={useLocalGameState}
      />
      <GameResultDisplay
        gameState={gameState}
        playerId={sharedProps.playerId}
      />
      <GameJsonDebug
        sentToServer={lastSent}
        receivedFromServer={lastReceived}
      />
    </>
  );
};

export default GameShell;
