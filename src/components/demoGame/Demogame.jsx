import { useState, useRef, useEffect, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./demoGame.css";
import ChatWindow from "./ChatWindow";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import PlayerControls from "./PlayerControls";
import GameTable from "./GameTable";
import { useGameState } from "./useGameState";
import { useNostrProfiles } from "./useNostrProfiles";

const CONFIG = {
  seatCountMin: 2,
  seatCountMax: 9,
  seatPaddingRatio: 0.1,
  tableRatio: 2 / 1,
};

const DemoGame = ({
  activePlayerId,
  setActivePlayerId,
  players = [],
  setPlayers,
  nostrProfileData,
  sendMessage,
  messages,
}) => {
  const [seatCount, setSeatCount] = useState(6);
  const tableRef = useRef(null);
  const [tableSize, setTableSize] = useState({ width: 600, height: 300 });
  const minBet = 50;
  const smallBlind = 10;
  const [betAmount, setBetAmount] = useState(minBet);
  const [playerBets, setPlayerBets] = useState({});
  const hasJoinedChatRef = useRef(false);
  const [playerChatMessages, setPlayerChatMessages] = useState({});
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());
  const displayGameMessages = useMemo(
    () =>
      Object.values(messages)
        .flat()
        .filter((m) => m?.payload?.type === "displayGame")
        .map((m) => m.payload),
    [messages]
  );

  const {
    playersAtTable,
    gameState,
    playerStacks,
    playerHands,
    holeCards,
    winnerOverlayId,
    setWinnerOverlayId,
    setPlayersAtTable,
  } = useGameState(displayGameMessages, activePlayerId, seatCount);

  useNostrProfiles(playersAtTable, setPlayersAtTable);

  const currentTurnPlayerId = gameState.turn;

  useEffect(() => {
    console.log("🔍 Messages updated:", messages);
  }, [messages]);

  useEffect(() => {
    console.log("🔍 displayGameMessages:", displayGameMessages);
  }, [displayGameMessages]);

  {
    /* Init table */
  }
  useEffect(() => {
    const updateSize = () => {
      if (tableRef.current) {
        const width = tableRef.current.offsetWidth;
        const height = width / CONFIG.tableRatio;
        setTableSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleSeatChange = (e) => {
    const newCount = parseInt(e.target.value);
    setSeatCount(newCount);

    setPlayersAtTable((prev) => {
      const updated = Array(newCount).fill(null);

      prev.forEach((player) => {
        if (
          player &&
          typeof player === "object" &&
          typeof player.seatIndex === "number" &&
          player.seatIndex < newCount
        ) {
          updated[player.seatIndex] = player;
        }
      });

      return updated;
    });
  };

  const handleSit = async (seatIndex) => {
    console.log("💡 SITTING AT SEAT INDEX:", seatIndex);
    let finalId;
    if (!activePlayerId) {
      const sk = generateSecretKey();
      finalId = getPublicKey(sk);
      setPlayers?.((prev) => [...prev, { id: finalId, pubkeySource: "guest" }]);
      setActivePlayerId?.(finalId);
      console.log("💥 SENDING FINAL ID:", finalId);

      sendMessage("displayGame", {
        relayId: "displayGame",
        payload: {
          type: "displayGame",
          action: "sit",
          playerId: finalId,
          gameId: "displayGame",
          gameActionParams: {
            seatIndex,
          },
        },
      });
    } else {
      console.log("💥 SENDINGID:", activePlayerId);

      sendMessage("displayGame", {
        relayId: "displayGame",
        payload: {
          type: "displayGame",
          action: "sit",
          playerId: activePlayerId,
          gameId: "displayGame",

          gameActionParams: {
            seatIndex,
          },
        },
      });
    }
  };

  {
    /* Join chat if seated */
  }
  useEffect(() => {
    console.log("💡 JOINING CHAT");
    if (!activePlayerId || hasJoinedChatRef.current) return;
    const isSeated = playersAtTable.some((p) => {
      const id = typeof p === "string" ? p : p?.playerId; // ← Use playerId
      return id === activePlayerId;
    });
    if (!isSeated) return;

    hasJoinedChatRef.current = true;

    sendMessage("chat", {
      relayId: "chat",
      payload: {
        type: "chat",
        action: "join",
        playerId: activePlayerId,
      },
    });
  }, [activePlayerId, playersAtTable]);

  const handleLeaveTable = () => {
    if (!activePlayerId) return;

    sendMessage("displayGame", {
      relayId: "displayGame",
      payload: {
        type: "displayGame",
        action: "leave",
        gameId: "displayGame",

        playerId: activePlayerId,
      },
    });
  };

  function parseCard(code) {
    if (!code || typeof code !== "string") return null;

    if (code === "X") {
      return {
        id: "X",
        src: "https://deckofcardsapi.com/static/img/back.png", // ✅ This is their card back image
        value: "X",
        suit: "X",
        isFaceDown: true,
      };
    }

    const value = code[0] === "T" ? "0" : code[0];
    const suit = code[1].toUpperCase();

    return {
      id: code,
      src: `https://deckofcardsapi.com/static/img/${value}${suit}.png`,
      value,
      suit,
      isFaceDown: false,
    };
  }

  const chatMessages = useMemo(() => {
    return Object.values(messages)
      .flat()
      .filter((m) => m?.payload?.type === "chat")
      .map((m) => m);
  }, [messages]);

  {
    /* Showdown winner overlay */
  }
  useEffect(() => {
    const { street, showdownWinner } = gameState;

    if (street === "showdown" && showdownWinner) {
      setWinnerOverlayId(showdownWinner);

      const timeout = setTimeout(() => {
        setWinnerOverlayId(null);
      }, 3000);

      return () => clearTimeout(timeout);
    } else if (street !== "showdown") {
      setWinnerOverlayId(null);
    }
  }, [gameState.street, gameState.showdownWinner]);

  {
    /* send server observer request */
  }
  useEffect(() => {
    if (!activePlayerId || typeof sendMessage !== "function") return;

    const timer = setTimeout(() => {
      console.log("📤 [OBSERVE] Sending for:", activePlayerId);

      sendMessage("displayGame", {
        relayId: "displayGame",
        payload: {
          type: "displayGame",
          action: "observe",
          playerId: activePlayerId,
          gameId: "displayGame",
        },
      });
    }, 200); // bump delay a little more for safety

    return () => clearTimeout(timer);
  }, [activePlayerId, sendMessage]);

  // set tableChat bubble
  useEffect(() => {
    if (chatMessages.length === 0) return;

    const latestChatMessage = chatMessages[chatMessages.length - 1];
    console.log("🔍 Latest chat message:", latestChatMessage);
    const latest = latestChatMessage?.payload;
    console.log("🔍 Latest chat message:", latest);
    if (!latest?.playerId || !latest?.text || !latestChatMessage.uuid) return;

    if (processedMessageIds.has(latestChatMessage.uuid)) return;
    const uuid = latestChatMessage.uuid;
    const { playerId, text, system } = latest;
    if (system) return; // 🚫 Skip system messages

    // Mark this message as processed
    setProcessedMessageIds((prev) => new Set([...prev, uuid]));

    // Show the chat bubble
    setPlayerChatMessages((prev) => ({
      ...prev,
      [playerId]: { text, timestamp: Date.now() },
    }));

    // Clear after 5 seconds
    setTimeout(() => {
      setPlayerChatMessages((prev) => {
        const updated = { ...prev };
        delete updated[playerId];
        return updated;
      });
    }, 5000);
  }, [chatMessages, processedMessageIds]);

  console.log("displayGameMessages ", displayGameMessages);
  console.log("currentTurnPlayerId ", currentTurnPlayerId);
  console.log("activePlayerId ", activePlayerId);
  console.log("playersAtTable ", playersAtTable);
  console.log("gameState ", gameState);
  console.log("playerBets ", playerBets);

  return (
    <div className="container-fluidpy-4">
      <div className="d-flex flex-column align-items-center mt-3">
        <h2 className="text-center mb-3 mt-3">Demo Table</h2>

        {/* Number of Seats Select */}
        <div className="mb-2 w-100" style={{ maxWidth: "300px" }}>
          <label htmlFor="seatCount" className="form-label">
            Number of Seats
          </label>
          <select
            id="seatCount"
            className="form-select"
            value={seatCount}
            onChange={handleSeatChange}
          >
            {Array.from(
              { length: CONFIG.seatCountMax - CONFIG.seatCountMin + 1 },
              (_, i) => i + CONFIG.seatCountMin
            ).map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        {/* Table Buttons */}
        <div className="d-flex gap-2 mb-2">
          <button
            type="button"
            className="btn btn-secondary gap-2 "
            onClick={handleLeaveTable}
          >
            Leave Table
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              sendMessage("displayGame", {
                relayId: "displayGame",
                payload: {
                  type: "displayGame",
                  action: "gameAction",
                  gameAction: "startHand",
                  playerId: activePlayerId,
                  gameId: "displayGame",
                },
              })
            }
          >
            🔁 New Hand
          </button>
        </div>

        {/* Player Turn and Street */}
        <div
          className="d-flex flex-row gap-2 mb-5"
          style={{ minHeight: "150px", maxHeight: "300px", overflowY: "auto" }}
        >
          {currentTurnPlayerId && (
            <div className="mb-3 text-center">
              <span className="badge bg-info text-dark">
                Player Turn:{" "}
                {playersAtTable.find((p) => p?.playerId === currentTurnPlayerId)
                  ?.name ||
                  currentTurnPlayerId?.slice(0, 6) ||
                  "Unknown"}
              </span>
            </div>
          )}
          <div className="mb-2 text-center">
            <span className="badge bg-warning text-dark">
              Street: {gameState.street.toUpperCase()}
            </span>
          </div>
          {gameState.turnsInRound.length > 0 && (
            <div className="mb-5 text-center">
              <span className="badge bg-secondary">
                Actions this round: {gameState.turnsInRound.length}
              </span>
            </div>
          )}
          {/* Start New Hand Button */}
        </div>

        {/* Showdown Results */}
        {gameState.street === "showdown" && (
          <div className="showdown-results text-center mb-4">
            <h4 className="mb-2">🃏 Showdown Hands</h4>
            {gameState.showdownResults?.map((res) => (
              <div key={res.id}>
                <strong>
                  {playersAtTable.find((p) => p?.playerId === res.id)?.name ||
                    res.id?.slice(0, 6) ||
                    "Unknown"}
                </strong>
                : {res.description}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Table */}
      <div className="d-flex flex-column align-items-center">
        <GameTable
          tableRef={tableRef}
          seatCount={seatCount}
          tableSize={tableSize}
          CONFIG={CONFIG}
          gameState={gameState}
          parseCard={parseCard}
          playersAtTable={playersAtTable}
          playerStacks={playerStacks}
          playerHands={playerHands}
          playerChatMessages={playerChatMessages}
          currentTurnPlayerId={currentTurnPlayerId}
          winnerOverlayId={winnerOverlayId}
          activePlayerId={activePlayerId}
          handleSit={handleSit}
        />
      </div>

      {/* Player Control */}
      <div className="d-flex flex-column align-items-center mb-5">
        <PlayerControls
          activePlayerId={activePlayerId}
          gameState={gameState}
          playerStacks={playerStacks}
          currentTurnPlayerId={currentTurnPlayerId}
          betAmount={betAmount}
          minBet={minBet}
          smallBlind={smallBlind}
          setBetAmount={setBetAmount}
          sendMessage={sendMessage}
          playersAtTable={playersAtTable}
          holeCards={holeCards}
        />
      </div>
      {/* Chat Window */}
      <div className="d-flex flex-column  align-items-center mb-5 mt-4">
        <h3 className="text-center mb-3">Demo Game Chat</h3>
        <ChatWindow
          playerId={activePlayerId}
          sendMessage={(msg) =>
            sendMessage("chat", {
              relayId: "chat",
              payload: {
                type: "chat",
                playerId: activePlayerId,
                text: msg.text,
                action: "chat",
              },
            })
          }
          messages={chatMessages}
          setPlayers={setPlayers}
          setActivePlayerId={setActivePlayerId}
          playersAtTable={playersAtTable}
        />
      </div>
    </div>
  );
};

export default DemoGame;
