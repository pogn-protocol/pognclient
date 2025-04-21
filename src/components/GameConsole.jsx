import React, { useEffect, useRef, useState } from "react";
import RockPaperScissors from "./RockPaperScissors";
import OddsAndEvens from "./OddsAndEvens";
import TicTacToe from "./TicTacToe";
import {
  JsonView,
  allExpanded,
  darkStyles,
  defaultStyles,
} from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { verifyGameMessage } from "../utils/verifications";
import "./css/gameConsole.css"; // Assuming you have a CSS file for styles
import GameShell from "./GameShell"; // once, in
import NoteGameResults from "./NoteGameResults"; // once, in

const GameConsole = ({
  sendMessage,
  message = {},
  playerId = "",
  gamesToInit,
  gameConnections,
  setAddRelayConnections,
  setGamesToInit,
  gameMessages,
  setRemoveRelayConnections,
  nostrPubkey,
  nostrProfile,
  messages,
}) => {
  const [gameStates, setGameStates] = useState(new Map());
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [gameMessagesSent, setGameMessagesSent] = useState({});
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [gameSummary, setGameSummary] = useState("");

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
    // existing logic
    sendMessage(gameId, message); // or however you're sending
  };

  useEffect(() => {
    if (!message || Object.keys(message).length === 0) {
      //console.warn("Skipping game message verification: empty message");
      return;
    }
    console.log("GameConsole message:", message);
    const { payload } = message;
    console.log("GameConsole payload:", payload);
    const { action, gameId } = payload;
    console.log("GameConsole action:", action, "gameId:", gameId);
    if (!verifyGameMessage(message, playerId, gameId)) {
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
  }, [message]);

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

        // Get the set of current game IDs to keep
        const allGameIds = new Set(allGames.map((game) => game.gameId));

        // Find connections to remove (ones not in allGameIds)
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
    console.log(
      "Rendering game component:",
      gameState,
      "for game ID:",
      gameId,
      "at URL:",
      gameUrl
    );
    const sharedProps = {
      sendGameMessage: (msg) => sendGameMessage(gameId, { ...msg }),
      playerId,
      gameState,
      gameId,
      disconnectSelf: () => disconnectGame(gameId), // ✅ secure scoped disconnect
      sentMessages: gameMessagesSent[gameId] || [],
      receivedMessages: gameMessages[gameId] || [],
      //gameUtils,
    };
    // switch (gameState.gameType) {
    //   case "rock-paper-scissors":
    //     return <RockPaperScissors {...sharedProps} />;
    //   case "odds-and-evens":
    //     return <OddsAndEvens {...sharedProps} />;
    //   case "tic-tac-toe":
    //     return <TicTacToe {...sharedProps} />;
    //   default:
    //     return <p>Game type not supported.</p>;
    // }
    switch (gameState.gameType) {
      case "rock-paper-scissors":
        return (
          <GameShell Component={RockPaperScissors} sharedProps={sharedProps} />
        );
      case "odds-and-evens":
        return <GameShell Component={OddsAndEvens} sharedProps={sharedProps} />;
      case "tic-tac-toe":
        return <GameShell Component={TicTacToe} sharedProps={sharedProps} />;
      default:
        console.error(
          `Unsupported game type: ${gameState.gameType} for game ID: ${gameId}`
        );
        return <p>Game type not supported.</p>;
    }
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

  // useEffect(() => {
  //   setGameSummary(
  //     "6393af1ca36d28601253da410311747c0048574cf18389240a3dbb7a28484722 won the game against thems which is also id6393af1ca36d28601253da410311747c0048574cf18389240a3dbb7a28484722"
  //   );
  //   setShowNoteModal(true);
  // }, []);

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

      <h1 className=" mb-4">Game Console</h1>
      <h4>Select a Game:</h4>
      <div
        className="border p-2 rounded mb-3"
        style={{ maxHeight: "200px", overflowY: "auto" }}
      >
        {console.log("Game Connections:", gameConnections)}
        {console.log("Game States:", gameStates)}
        {Array.from(gameConnections.entries())
          .filter(([id]) => gameStates.get(id)?.lobbyStatus === "started")
          .map(([id]) => (
            <button
              key={id}
              onClick={() => setSelectedGameId(id)}
              className={`btn w-100 text-start mb-1 ${
                selectedGameId === id ? "btn-primary" : "btn-outline-secondary"
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
                <div className="mt-3">
                  <h4>All Game Console Messages:</h4>
                </div>
                <div style={{ display: "flex", gap: "20px" }}>
                  {/* Received Messages */}
                  <div>
                    <h6>Received</h6>
                    {console.log(
                      "🧾 All gameMessages keys:",
                      Object.keys(gameMessages)
                    )}
                    {console.log("🧾 Current gameId selected:", gameId)}
                    {gameMessages[gameId]?.length > 1 && (
                      <details style={{ marginBottom: "8px" }}>
                        <summary>
                          Previous ({gameMessages[gameId].length - 1})
                        </summary>
                        {gameMessages[gameId].slice(0, -1).map((msg, i) => (
                          <div
                            className="jsonMessage"
                            key={`recv-${gameId}-${i}`}
                          >
                            <JsonView
                              data={msg}
                              shouldExpandNode={() => false}
                              style={{ fontSize: "14px", lineHeight: "1.2" }}
                            />
                          </div>
                        ))}
                      </details>
                    )}
                    {gameMessages[gameId]?.slice(-1).map((msg, i) => (
                      <div
                        className="jsonMessage"
                        key={`recv-last-${gameId}-${i}`}
                      >
                        <JsonView
                          data={msg}
                          shouldExpandNode={() => true}
                          style={{ fontSize: "14px", lineHeight: "1.2" }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Sent Messages */}
                  <div>
                    <h6>Sent</h6>
                    {gameMessagesSent[gameId]?.length > 1 && (
                      <details style={{ marginBottom: "8px" }}>
                        <summary>
                          Previous ({gameMessagesSent[gameId].length - 1})
                        </summary>
                        {gameMessagesSent[gameId].slice(0, -1).map((msg, i) => (
                          <div
                            className="jsonMessage"
                            key={`sent-${gameId}-${i}`}
                          >
                            <JsonView
                              data={msg}
                              shouldExpandNode={() => false}
                              style={{ fontSize: "14px", lineHeight: "1.2" }}
                            />
                          </div>
                        ))}
                      </details>
                    )}
                    {gameMessagesSent[gameId]?.slice(-1).map((msg, i) => (
                      <div
                        className="jsonMessage"
                        key={`sent-last-${gameId}-${i}`}
                      >
                        <JsonView
                          data={msg}
                          shouldExpandNode={() => true}
                          style={{ fontSize: "14px", lineHeight: "1.2" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default GameConsole;
