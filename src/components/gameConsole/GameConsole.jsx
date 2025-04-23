import React, { useEffect, useState } from "react";
import gameComponents from "../games/gamesIndex"; // once, in
import { verifyGameMessage } from "../../utils/verifications";
import GameShell from "./GameShell"; // once, in
import NoteGameResults from "./NoteGameResults"; // once, in
import MessagesUI from "../messages/MessagesUI"; // once, in

const GameConsole = ({
  sendMessage,
  activePlayerId,
  gamesToInit,
  gameConnections,
  setAddRelayConnections,
  setGamesToInit,
  gameMessages,
  setRemoveRelayConnections,
  messages,
  nostrProfile,
}) => {
  const nostrPubkey = nostrProfile?.id;
  const playerId = activePlayerId;
  const [gameStates, setGameStates] = useState(new Map());
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [gameMessagesSent, setGameMessagesSent] = useState({});
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [gameSummary, setGameSummary] = useState("");
  const [lastGameMessage, setLastGameMessage] = useState(null);

  useEffect(() => {
    const allMessages = Object.values(gameMessages).flat();
    if (allMessages.length > 0) {
      setLastGameMessage(allMessages[allMessages.length - 1]);
    }
  }, [gameMessages]);

  const sendGameMessage = (gameId, payload) => {
    console.log("sendGameMessage gameId payload:", gameId, payload);

    if (!payload || !gameId) {
      console.error("Invalid game message:", payload);
      return;
    }
    const message = {
      relayId: gameId,
      payload: {
        type: "game",
        action: "gameAction",
        ...payload,
        gameId,
      },
    };

    console.log("GameConsole sendGameMessage message:", message);
    setGameMessagesSent((prev) => {
      const updated = { ...prev };
      updated[gameId] = [...(updated[gameId] || []), message];
      return updated;
    });
    sendMessage(gameId, message); // or however you're sending
  };

  useEffect(() => {
    if (!lastGameMessage || Object.keys(lastGameMessage).length === 0) {
      //console.warn("Skipping game message verification: empty message");
      return;
    }
    console.log("GameConsole message:", lastGameMessage);
    const { payload } = lastGameMessage;
    console.log("GameConsole payload:", payload);
    const { action, gameId } = payload;
    console.log("GameConsole action:", action, "gameId:", gameId);
    if (!verifyGameMessage(lastGameMessage, playerId, gameId)) {
      return;
    }

    switch (action) {
      case "gameAction":
        updateGameState(gameId, payload); // ✅ Centralized update
        console.log(`🛠️ Updated GameState for ${gameId}:`, payload);
        break;

      case "gameEnded":
        setGameStates((prevStates) => {
          const updatedMap = new Map(prevStates);
          updatedMap.delete(gameId);
          return updatedMap;
        });
        console.log("🛑 Game Ended:", gameId);
        break;

      default:
        console.warn(`Unhandled action: ${action}`);
    }
  }, [lastGameMessage]);

  useEffect(() => {
    if (gamesToInit.size > 0) {
      console.log("🚀 Initializing new games:", gamesToInit);

      const gamesArray = Array.from(gamesToInit.values()).flat();
      console.log("🚀 Initializing new games:", gamesArray);
      setAddRelayConnections((prev) => [
        ...prev,
        ...gamesArray.map((game) => ({
          id: game.gameId,
          url: game.wsAddress,
          type: "game",
        })),
      ]);
    }
  }, [gamesToInit, setAddRelayConnections]);

  useEffect(() => {
    if (gamesToInit.size === 0) {
      console.log("No games to initialize.");
      return;
    }
    if (gameConnections.size > 0) {
      // Flatten the gamesToInit map into an array of games
      const allGames = Array.from(gamesToInit.values()).flat();
      console.log("All games to initialize:", allGames);

      const allReady = allGames.every((game) => {
        const connection = gameConnections.get(game.gameId);
        return connection && connection.readyState === 1;
      });

      if (allReady) {
        console.log("✅ All game connections are ready, initializing games.");
        const lobbyIdsToInit = Array.from(gamesToInit.keys());
        console.log("Lobby IDs to initialize:", lobbyIdsToInit);

        const gamesRefreshed = [];

        setGamesToInit((prev) => {
          const updated = new Map(prev);
          for (const lobbyId of lobbyIdsToInit) {
            updated.delete(lobbyId);
          }
          return updated;
        });

        console.log("gamesRefreshed:", gamesRefreshed);
        initNewGames(allGames);

        const allGameIds = new Set(allGames.map((game) => game.gameId));
        const connectionsToRemove = gamesRefreshed.filter(
          (id) => !allGameIds.has(id)
        );

        if (connectionsToRemove.length > 0) {
          console.log(
            "🗑️ Removing stale relay connections:",
            connectionsToRemove
          );
          setRemoveRelayConnections((prev) => [
            ...prev,
            ...connectionsToRemove,
          ]);
        }
        console.log("🚀 Game initialization complete.");
      } else {
        console.log("⏳ Waiting for all game connections to be ready.");
      }
    }
  }, [gameConnections, gamesToInit]);

  const initNewGames = (games) => {
    console.log("Initializing games", games);

    setGameStates((prevStates) => {
      const updated = new Map(prevStates);

      games.forEach((game) => {
        const gameId = game.gameId;
        const connection = gameConnections.get(gameId);

        if (!connection || connection.readyState !== 1) {
          console.warn(`❌ Skipping ${gameId}: connection not ready`);
          return;
        }

        if (updated.has(gameId)) {
          console.log(`🛑 Skipping ${gameId}: already in gameStates`);
          return;
        }

        console.log(`✅ Initializing new gameState for ${gameId}`);
        updated.set(gameId, game);
      });

      return updated;
    });
  };

  const updateGameState = (gameId, newState) => {
    setGameStates((prevStates) => {
      const updatedMap = new Map(prevStates);
      const currentGameState = updatedMap.get(gameId) || {};
      updatedMap.set(gameId, {
        ...currentGameState,
        ...newState,
      });
      console.log(updatedMap);
      if (newState.gameStatus === "complete") {
        console.log(`🏁 Game ${gameId} is now complete!`);
        setGameSummary(newState?.message || "No summary provided.");
        setShowNoteModal(true);
      }
      return updatedMap;
    });
  };

  const disconnectGame = (gameId) => {
    if (!gameId || !gameConnections.has(gameId)) {
      console.warn(
        `⚠️ Cannot disconnect: invalid or missing gameId: ${gameId}`
      );
      return;
    }
    console.log(`🧹 Requested disconnect from game ${gameId}`);
    setRemoveRelayConnections((prev) => [...prev, gameId]);
  };

  const renderGameComponent = (gameId, gameState, gameUrl) => {
    const Component = gameComponents[gameState.gameType];
    console.log(
      "Rendering game component:",
      gameState,
      "for game ID:",
      gameId,
      "at URL:",
      gameUrl
    );

    return (
      <GameShell
        Component={Component}
        sharedProps={{
          sendGameMessage: (msg) => sendGameMessage(gameId, { ...msg }),
          playerId,
          gameState,
          gameId,
          disconnectSelf: () => disconnectGame(gameId),
          sentMessages: gameMessagesSent[gameId] || [],
          receivedMessages: gameMessages[gameId] || [],
        }}
      />
    );
  };

  const connectedGames = Array.from(gameConnections.entries()).filter(
    ([id, conn]) =>
      conn.readyState === 1 && gameStates.get(id)?.lobbyStatus === "started"
  );
  console.log("Connected games:", connectedGames);

  useEffect(() => {
    if (!selectedGameId) {
      const firstGameId = connectedGames[0]?.[0];
      if (firstGameId) {
        setSelectedGameId(firstGameId);
      }
    }
  }, [connectedGames, selectedGameId]);

  const postNote = async (note) => {
    if (!activePlayerId) return;
    const message = {
      payload: {
        type: "game",
        action: "postNote",
        playerId: playerId,
        note,
      },
    };
    handleSendMessage(playerId, message);
    setShowNoteModal(false);
  };

  const lastPostResultMessage = Object.values(messages)
    .flat()
    .reverse()
    .find((msg) => msg?.payload?.action === "postGameResultConfirmed");

  return (
    <div className="gameConsole">
      {showNoteModal && (
        <NoteGameResults
          playerId={playerId}
          nostrPubkey={nostrPubkey}
          nostrProfile={nostrProfile}
          isOpen={true} // always true since it's wrapped in the guard
          onClose={() => setShowNoteModal(false)}
          onConfirm={postNote}
          gameSummary={gameSummary}
          sendMessage={sendMessage}
          message={lastPostResultMessage || {}}
        />
      )}

      <h1 className="text-xl font-bold text-gray-800 mb-2">Game Console</h1>
      <h5 className="text-base font-semibold text-gray-800 mb-2">
        Select a Game:
      </h5>

      <div className="border p-2 rounded mb-3 max-h-[200px] overflow-y-auto">
        {console.log("Game Connections:", gameConnections)}
        {console.log("Game States:", gameStates)}
        {Array.from(gameConnections.entries())
          .filter(([id]) => gameStates.get(id)?.lobbyStatus === "started")
          .map(([id]) => (
            <button
              key={id}
              onClick={() => setSelectedGameId(id)}
              className={`w-full text-left px-3 py-2 mb-1 rounded ${
                selectedGameId === id
                  ? "bg-blue-600 text-white"
                  : "border border-gray-400 bg-white hover:bg-gray-100 text-gray-800"
              }`}
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {id}
            </button>
          ))}
      </div>

      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #ccc",
        }}
      >
        {console.log("Game States:", gameStates)}
        {Array.from(gameStates.entries())
          .filter(([id]) => id === selectedGameId)
          .map(([gameId, gameState]) => {
            const wsAddress = gameState.wsAddress;
            const connectionState = gameConnections.get(gameId)?.readyState;
            console.log(gameConnections);
            console.log("Connection state:", connectionState);
            const connectionColor =
              connectionState === 1
                ? "green"
                : connectionState === 3
                ? "red"
                : "yellow";
            console.log("Connection color:", connectionColor);

            const connectionTitle =
              connectionState === 1
                ? "Connected"
                : connectionState === 0
                ? "Connecting..."
                : connectionState === 2
                ? "Closing..."
                : "Disconnected";
            console.log("Connection title:", connectionTitle);

            return (
              <div
                key={gameId}
                style={{
                  marginBottom: "20px",
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                <h5>Game ID: {gameId}</h5>
                <div className="d-flex  mb-2">
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: connectionColor,
                      border: "1px solid #333",
                    }}
                    title={connectionTitle}
                  ></div>
                  <div style={{ marginLeft: "10px" }}>
                    <p> {connectionTitle}</p>
                  </div>
                </div>

                {console.log(
                  `Rendering game component gameType: ${gameState.gameType} for game ID: ${gameId} at URL: ${wsAddress}`
                )}
                {renderGameComponent(gameId, gameState, wsAddress)}
              </div>
            );
          })}
      </div>
      <div className="flex flex-wrap gap-4 w-full">
        <MessagesUI
          title="All Game Console Messages:"
          messageGroups={[
            {
              title: "Received",
              msgs: Object.values(gameMessages).flat(),
            },
            {
              title: "Sent",
              msgs: Object.values(gameMessagesSent).flat(),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default GameConsole;
