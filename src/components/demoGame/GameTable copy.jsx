import React, { useState, useRef, useEffect, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./gameTable.css";
import PlayerHUD from "./PlayerHUD";
import { getTurnPlayer, getNextTurnIndex, getNextStreet } from "./pokerUtils";
import Ranker from "handranker";
import ChatWindow from "./ChatWindow";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import { SimplePool } from "nostr-tools/pool";
const relays = [
  "wss://relay.damus.io",
  "wss://relay.snort.social",
  "wss://nos.lol",
  "wss://relay.nostr.band",
];
const pool = new SimplePool();

const CONFIG = {
  seatCountMin: 2,
  seatCountMax: 9,
  seatPaddingRatio: 0.1,
  tableRatio: 2 / 1,
};

const GameTable = ({
  activePlayerId,
  setActivePlayerId,
  players = [],
  setPlayers,
  nostrProfileData,
  sendMessage,
  messages,
}) => {
  const [seatCount, setSeatCount] = useState(6);
  const [playersAtTable, setPlayersAtTable] = useState(() =>
    Array(6).fill(null)
  );
  const tableRef = useRef(null);
  const [tableSize, setTableSize] = useState({ width: 600, height: 300 });
  const minBet = 50;
  const smallBlind = 10;
  const [betAmount, setBetAmount] = useState(minBet);
  const [playerBets, setPlayerBets] = useState({});
  const [holeCards, setHoleCards] = useState([]);
  const [playerHands, setPlayerHands] = useState({});
  const [gameState, setGameState] = useState({
    dealerIndex: 0,
    currentTurnIndex: 0,
    street: "preflop",
    turnsInRound: [],
    playerActions: {},
    communityCards: [],
    blindsPosted: false,
  });
  const [playerStacks, setPlayerStacks] = useState({});
  const hasJoinedChatRef = useRef(false);
  const [winnerOverlayId, setWinnerOverlayId] = useState(null);
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
  useEffect(() => {
    console.log("🔍 Messages updated:", messages);
  }, [messages]);

  useEffect(() => {
    console.log("🔍 displayGameMessages:", displayGameMessages);
  }, [displayGameMessages]);

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

  const handleSitInternal = async (seatIndex) => {
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

  useEffect(() => {
    const latestPrivate = [...displayGameMessages]
      .reverse()
      .find((m) => m?.hands); 
    console.log("✅ Found latest private hand message:", latestPrivate);

    if (latestPrivate) {
      console.log("✅ Found latest private hand message:", latestPrivate);

      const parsedHands = {};
      for (const [pid, hand] of Object.entries(latestPrivate.hands)) {
        const parsed = Array.isArray(hand)
          ? hand.map((card) => (card ? parseCard(card) : null))
          : [];
        parsedHands[pid] = parsed;
      }
      console.log("Parsed player hands:", parsedHands);
      setPlayerHands(parsedHands);

      const viewerId = activePlayerId || null;
      const myHand = Array.isArray(latestPrivate.hand)
        ? latestPrivate.hand.map((card) => parseCard(card))
        : [];

      console.log(`👤 Hole cards for viewer ${viewerId}:`, myHand);
      setHoleCards(myHand);
    } else {
      console.warn("❌ No valid private hand message found.");
    }
  }, [displayGameMessages, activePlayerId]);

  useEffect(() => {
    const msg = displayGameMessages[displayGameMessages.length - 1];
    console.log("msg", msg);
    if (!msg) return;

    const {
      action,
      playerId,
      playersAtTable: incomingSeats,
      gameState: newGameState,
      showdownWinner,
      showdownResults,
    } = msg;

    if (Array.isArray(incomingSeats)) {
      console.log(
        "✅ Updating players at table with incoming seats:",
        incomingSeats
      );
      console.log("seatCount", seatCount);
      const updatedSeats = Array(seatCount).fill(null);
      for (const entry of incomingSeats) {
        const { playerId, seatIndex } = entry;
        console.log("entry", entry);
        if (
          typeof seatIndex === "number" &&
          seatIndex < seatCount &&
          playerId
        ) {
          updatedSeats[seatIndex] = { playerId, seatIndex };
        }
      }
      console.log("updatedSeats", updatedSeats);
      setPlayersAtTable((prev) => {
        const same =
          prev.length === updatedSeats.length &&
          prev.every((val, i) => {
            const next = updatedSeats[i];
            if (!val && !next) return true;
            if (!val || !next) return false;
            return val.playerId === next.playerId;
          });

        return same ? prev : updatedSeats;
      });
      console.log("✅ PlayersAtTable: ", playersAtTable);
    }

    if (newGameState?.players) {
      const stackMap = {};
      for (const [pid, pdata] of Object.entries(newGameState.players)) {
        stackMap[pid] = pdata.stack;
      }
      setPlayerStacks(stackMap);

      setGameState((prev) => ({
        ...prev,
        ...newGameState,
        ...(showdownWinner && { showdownWinner }),
        ...(showdownResults && { showdownResults }),
      }));
    }

    if (msg.revealedHands) {
      console.log("✅ Revealed hands message received:", msg.revealedHands);
      const parsed = {};
      for (const { playerId, hand } of msg.revealedHands) {
        parsed[playerId] = hand.map(parseCard); // your parseCard already works
      }
      setPlayerHands(parsed); // will be passed into PlayerHUD
    }
  }, [displayGameMessages, seatCount]);

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

  const { width, height } = tableSize;
  const cx = width / 2;
  const cy = height / 2;
  const radiusX = width / 2;
  const radiusY = height / 2;
  const seatOffsetX = radiusX * CONFIG.seatPaddingRatio;
  const seatOffsetY = radiusY * CONFIG.seatPaddingRatio;

  const handleSliderChange = (e) => {
    setBetAmount(Number(e.target.value));
  };

  const handleInputChange = (e) => {
    setBetAmount(Number(e.target.value));
  };

  const currentTurnPlayerId = gameState.turn;

  const dealerId =
    typeof gameState.buttonIndex === "number" &&
    playersAtTable.length > gameState.buttonIndex
      ? playersAtTable[gameState.buttonIndex]?.playerId
      : null;

  useEffect(() => {
    console.log("🔍 Checking dealer ID...");
    console.log("gameState.buttonIndex:", gameState.buttonIndex);
    console.log("playersAtTable:", playersAtTable);

    if (
      typeof gameState.buttonIndex === "number" &&
      playersAtTable[gameState.buttonIndex] &&
      typeof playersAtTable[gameState.buttonIndex] === "object"
    ) {
      const dealerId = playersAtTable[gameState.buttonIndex]?.playerId;
      console.log("🎯 Dealer is:", dealerId);
    }
  }, [gameState.buttonIndex, playersAtTable]);

  useEffect(() => {
    const { street, communityCards, deck } = gameState;

    if (street === "flop" && communityCards.length === 0 && deck?.length >= 3) {
      setGameState((prev) => ({
        ...prev,
        communityCards: deck.slice(0, 3),
        deck: deck.slice(3),
      }));
    } else if (
      street === "turn" &&
      communityCards.length === 3 &&
      deck?.length >= 1
    ) {
      setGameState((prev) => ({
        ...prev,
        communityCards: [...communityCards, deck[0]],
        deck: deck.slice(1),
      }));
    } else if (
      street === "river" &&
      communityCards.length === 4 &&
      deck?.length >= 1
    ) {
      setGameState((prev) => ({
        ...prev,
        communityCards: [...communityCards, deck[0]],
        deck: deck.slice(1),
      }));
    }
  }, [gameState.street, gameState.communityCards, gameState.deck]);

  const getPlayerHandRank = () => {
    if (!holeCards?.length) return null;

    console.log("🔍 Calculating player hand rank...");
    const board = gameState.communityCards || [];
    console.log("🃏 Board cards:", board);
    console.log("🕳️ Hole cards:", holeCards);

    const toRankerFormat = (card) => {
      if (!card) return null;

      if (typeof card === "string") {
        console.log("Board card as string:", card);
        return card.length === 2 ? card : null;
      }

      if (!card.value || !card.suit) return null;

      const rank = card.value === "0" ? "T" : card.value.toUpperCase();
      const suit = card.suit.toLowerCase(); // must be 'c', 'd', 'h', or 's'
      const formatted = rank + suit;
      console.log("Formatted hole card:", formatted);
      return formatted;
    };

    const cards = [...holeCards, ...board].map(toRankerFormat).filter(Boolean);

    console.log("🎯 Cards to rank:", cards);

    if (cards.length < 5) {
      console.warn(
        "❗ Not enough cards to evaluate. Needed 5, got:",
        cards.length
      );
      return null;
    }

    try {
      const result = Ranker.getHand(cards);
      console.log("✅ Hand rank result:", result);
      return result?.description || null;
    } catch (err) {
      console.error("❌ Ranker failed on cards:", cards, err);
      return null;
    }
  };

  const chatMessages = useMemo(() => {
    return Object.values(messages)
      .flat()
      .filter((m) => m?.payload?.type === "chat")
      .map((m) => m);
  }, [messages]);

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

  useEffect(() => {
    const fetchNostrProfile = async (pubkey) => {
      console.log(`🌐 Fetching Nostr profile for ${pubkey}`);
      return new Promise((resolve) => {
        const sub = pool.subscribe(
          relays,
          { kinds: [0], authors: [pubkey], limit: 1 },
          {
            onevent(event) {
              try {
                const metadata = JSON.parse(event.content);
                console.log(`✅ [${pubkey}] Profile FOUND:`, metadata);
                resolve(metadata);
              } catch (e) {
                console.warn(`❌ [${pubkey}] Parse FAIL:`, e);
                resolve(null);
              } finally {
                sub.close();
              }
            },
            oneose() {
              console.log(`⚠️ [${pubkey}] EOSE — No profile found.`);
              resolve(null);
              sub.close();
            },
          }
        );
      });
    };

    const resolveUnknownProfiles = async () => {
      console.log("🔍 [Profile Resolver] BEGIN");

      if (!Array.isArray(playersAtTable) || playersAtTable.length === 0) {
        console.warn("🛑 playersAtTable missing or empty — skipping resolver.");
        return;
      }

      console.log("🧑‍🤝‍🧑 playersAtTable:", playersAtTable);

      const unresolved = playersAtTable.filter((p) => {
        if (!p || typeof p !== "object") {
          console.warn("🚫 Bad entry in playersAtTable:", p);
          return false;
        }
        const { playerId, name, display_name, picture } = p;
        const isValidId =
          typeof playerId === "string" && /^[a-fA-F0-9]{64}$/.test(playerId);
        const hasProfile = name || display_name || picture;
        return isValidId && !hasProfile;
      });

      const unresolvedIds = unresolved.map((p) => p.playerId);
      console.log("🕵️ Unresolved pubkeys:", unresolvedIds);

      if (unresolvedIds.length === 0) {
        console.log("✅ No unresolved profiles.");
        return;
      }

      const results = await Promise.allSettled(
        unresolvedIds.map(async (id) => {
          try {
            const profile = await fetchNostrProfile(id);
            console.log("📬 Profile fetched for", id, "=>", profile);
            return { playerId: id, profile };
          } catch (err) {
            return { playerId: id, profile: null, error: err };
          }
        })
      );

      console.log("🧾 RESULTS:", results);

      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          const { playerId, profile } = result.value;
          console.log(
            `  🔹 [${playerId}] ${profile ? "✅ RESOLVED" : "❌ NULL"}:`,
            profile
          );
        } else {
          console.warn(`  ❌ REJECTED [${unresolvedIds[i]}]:`, result.reason);
        }
      });

      const updates = results
        .filter((r) => r.status === "fulfilled" && r.value.profile)
        .map((r) => r.value);

      if (updates.length > 0) {
        console.log(
          "🔁 Injecting resolved profiles into playersAtTable:",
          updates
        );
        setPlayersAtTable((prev) =>
          prev.map((entry) => {
            if (!entry || !entry.playerId) return entry;
            const match = updates.find((u) => u.playerId === entry.playerId);
            return match ? { ...entry, ...match.profile } : entry;
          })
        );
      } else {
        console.log("😶 No valid profiles to inject.");
      }

      console.log("✅ [Profile Resolver] DONE");
    };

    resolveUnknownProfiles();
  }, [playersAtTable]);

  return (
    <div className="container-fluidpy-4">
      <div className="d-flex flex-column align-items-center mt-3">
        <h2 className="text-center mb-3 mt-3">Demo Table</h2>
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

        <div
          ref={tableRef}
          className="gameTableDiv position-relative mb-5 px-4"
          style={{
            width: "85%",
            maxWidth: "900px",
            aspectRatio: CONFIG.tableRatio,
          }}
        >
          <div className="gameTable-center">
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "4vw",
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.25)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                zIndex: 0,
                textShadow: "1px 1px 2px rgba(0,0,0,0.4)",
              }}
            >
              ♠ POGN ♣
            </div>

            <div
              style={{
                position: "absolute",
                top: "9%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "2vw",
                fontWeight: 700,
              }}
            >
              Pot: ${gameState.pot || 0}
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                gap: "8px",
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {gameState.communityCards.map((code, i) => {
                const card = parseCard(code);
                return (
                  <img
                    key={i}
                    src={card.src}
                    alt={card.id}
                    style={{
                      width: "clamp(30px, 7vw, 60px)",
                      height: "auto",
                      flexShrink: 0,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {Array(seatCount)
            .fill(null)
            .map((_, idx) => {
              const angle = (2 * Math.PI * idx) / seatCount - Math.PI / 2;
              const x = cx + (radiusX + seatOffsetX) * Math.cos(angle);
              const y = cy + (radiusY + seatOffsetY) * Math.sin(angle);
              const playerObj = playersAtTable[idx];
              const playerId = playerObj?.playerId;

              return (
                <PlayerHUD
                  key={idx}
                  seatIndex={idx}
                  seatCount={seatCount}
                  playerId={playerId}
                  playerObj={playerObj}
                  currentBet={gameState?.players?.[playerId]?.bet || 0}
                  isDealer={playerId === dealerId}
                  seat={{
                    top: (y / height) * 100,
                    left: (x / width) * 100,
                  }}
                  onClick={() => {
                    if (
                      !playerId ||
                      playerId === activePlayerId ||
                      !activePlayerId
                    ) {
                      handleSitInternal(idx);
                    }
                  }}
                  gameState={gameState}
                  isCurrentTurn={playerId === currentTurnPlayerId}
                  stack={playerStacks[playerId] || 0}
                  holeCards={
                    Array.isArray(playerHands[playerId])
                      ? playerHands[playerId]
                      : []
                  }
                  isWinner={playerId && playerId === winnerOverlayId}
                  chatMessage={playerChatMessages[playerId]?.text}
                />
              );
            })}
        </div>
        {playersAtTable.some((p) => p?.playerId === activePlayerId) &&
          gameState.players?.[activePlayerId] && (
            <div className="w-50 d-flex mt-5 flex-column justify-content-end">
              {getPlayerHandRank() && (
                <div className="text-center my-3">
                  <span className="badge bg-success">
                    You have: {getPlayerHandRank()}
                  </span>
                </div>
              )}

              <div className="w-100 mb-2 d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    setBetAmount((prev) => Math.max(minBet, prev - smallBlind))
                  }
                  disabled={currentTurnPlayerId !== activePlayerId}
                >
                  –
                </button>
                <input
                  type="number"
                  className="form-control"
                  min={minBet}
                  max={playerStacks[activePlayerId] || minBet}
                  step={smallBlind}
                  value={betAmount}
                  onChange={handleInputChange}
                  disabled={currentTurnPlayerId !== activePlayerId}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    setBetAmount((prev) => Math.min(1000, prev + smallBlind))
                  }
                  disabled={currentTurnPlayerId !== activePlayerId}
                >
                  +
                </button>
              </div>
              <div
                className="btn-group mb-2 w-100 gap-2"
                role="group"
                aria-label="Action Buttons"
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={currentTurnPlayerId !== activePlayerId}
                  onClick={() =>
                    sendMessage("displayGame", {
                      relayId: "displayGame",
                      payload: {
                        type: "displayGame",
                        action: "gameAction",
                        gameAction: "fold",
                        playerId: activePlayerId,
                        gameId: "displayGame",
                      },
                    })
                  }
                >
                  Fold
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={currentTurnPlayerId !== activePlayerId}
                  onClick={() =>
                    sendMessage("displayGame", {
                      relayId: "displayGame",
                      payload: {
                        type: "displayGame",
                        action: "gameAction",
                        gameAction: "check",
                        playerId: activePlayerId,
                        gameId: "displayGame",
                      },
                    })
                  }
                >
                  Check
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={currentTurnPlayerId !== activePlayerId}
                  onClick={() =>
                    sendMessage("displayGame", {
                      relayId: "displayGame",
                      payload: {
                        type: "displayGame",
                        action: "gameAction",
                        gameAction: "bet",
                        playerId: activePlayerId,
                        gameId: "displayGame",

                        gameActionParams: {
                          amount: betAmount,
                        },
                      },
                    })
                  }
                >
                  Bet {betAmount}
                </button>
              </div>

              {/* Bet Slider */}
              <div className="w-100 mb-2">
                <input
                  type="range"
                  className="form-range"
                  min={minBet}
                  max={playerStacks[activePlayerId] || minBet}
                  step={smallBlind}
                  value={betAmount}
                  onChange={handleSliderChange}
                />
              </div>
            </div>
          )}
      </div>
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

export default GameTable;
