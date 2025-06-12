import React, { useState, useRef, useEffect, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./gameTable.css";
import PlayerHUD from "./PlayerHUD";
import { getTurnPlayer, getNextTurnIndex, getNextStreet } from "./pokerUtils";
import Ranker from "handranker";
import ChatWindow from "./ChatWindow";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";

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
  const [playersAtTable, setPlayersAtTable] = useState([]);
  const tableRef = useRef(null);
  const [tableSize, setTableSize] = useState({ width: 600, height: 300 });
  const minBet = 50;
  const smallBlind = 10;
  const [betAmount, setBetAmount] = useState(minBet);
  const [potTotal, setPotTotal] = useState(0);
  const [playerBets, setPlayerBets] = useState({});
  const [gameState, setGameState] = useState({
    dealerIndex: 0,
    currentTurnIndex: 3,
    isPreflop: true,
    street: "preflop", // NEW
    turnsInRound: [], // NEW: array of playerIds who have acted
    playerActions: {},
    communityCards: [], // flop, turn, river
    //playerHands: {}, // { playerId: [card1, card2] }
    // deck: [], // current shuffled deck
    blindsPosted: false,
  });
  const [playerStacks, setPlayerStacks] = useState({});
  const [holeCards, setHoleCards] = useState([]);
  const hasJoinedChatRef = useRef(false);

  // Initialize stacks if not set
  useEffect(() => {
    setPlayerStacks((prev) => {
      const updated = { ...prev };
      for (const id of playersAtTable) {
        if (id && !(id in updated)) {
          updated[id] = 1000; // starting stack
        }
      }
      return updated;
    });
  }, [playersAtTable]);

  const allPlayers = useMemo(() => {
    const bot1 = { id: "pokerBot", name: "Bot" };
    const bot2 = { id: "pokerBot2", name: "Bot 2" };
    const filtered = players.filter(
      (p) => p.id !== "pokerBot" && p.id !== "pokerBot2"
    );
    return [...filtered, bot1, bot2];
  }, [players]);

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
      for (let i = 0; i < Math.min(prev.length, newCount); i++) {
        updated[i] = prev[i];
      }
      return updated;
    });
  };

  const handleSitInternal = async (seatIndex) => {
    let finalId;

    if (!activePlayerId) {
      const sk = generateSecretKey();
      finalId = getPublicKey(sk);

      // Update the players list with the new ID
      setPlayers?.((prev) => [...prev, { id: finalId, pubkeySource: "guest" }]);

      // Set active player ID
      setActivePlayerId?.(finalId);

      // Wait a short moment for React to process the state updates
      // Then send the sit message
      console.log("💥 SENDING FINAL ID:", finalId);

      sendMessage("displayGame", {
        relayId: "displayGame",
        payload: {
          type: "displayGame",
          action: "sit",
          playerId: finalId,
          seatIndex,
        },
      });
    } else {
      // Then send the sit message
      console.log("💥 SENDING FINAL ID:", finalId);

      sendMessage("displayGame", {
        relayId: "displayGame",
        payload: {
          type: "displayGame",
          action: "sit",
          playerId: activePlayerId,
          seatIndex,
        },
      });
    }

    // First send the join message
  };

  useEffect(() => {
    console.log("💡 JOINING CHAT");
    if (!activePlayerId || hasJoinedChatRef.current) return;

    // Confirm the active player is seated
    const isSeated = playersAtTable.includes(activePlayerId);
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
        playerId: activePlayerId,
      },
    });
  };

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

  const activePlayers = playersAtTable.filter(Boolean);
  const currentTurnPlayerId = getTurnPlayer(
    activePlayers,
    gameState.currentTurnIndex
  );

  const dealerId = playersAtTable[gameState.dealerIndex];

  useEffect(() => {
    const { street, communityCards, deck } = gameState;

    if (street === "flop" && communityCards.length === 0 && deck.length >= 3) {
      setGameState((prev) => ({
        ...prev,
        communityCards: deck.slice(0, 3),
        deck: deck.slice(3),
      }));
    } else if (
      street === "turn" &&
      communityCards.length === 3 &&
      deck.length >= 1
    ) {
      setGameState((prev) => ({
        ...prev,
        communityCards: [...communityCards, deck[0]],
        deck: deck.slice(1),
      }));
    } else if (
      street === "river" &&
      communityCards.length === 4 &&
      deck.length >= 1
    ) {
      setGameState((prev) => ({
        ...prev,
        communityCards: [...communityCards, deck[0]],
        deck: deck.slice(1),
      }));
    }
  }, [gameState.street, gameState.communityCards, gameState.deck]);

  const getPlayerHandRank = () => {
    //const playerHand = gameState.playerHands[activePlayerId] || [];
    const board = gameState.communityCards || [];

    if (holeCards.length < 2 || board.length + holeCards.length < 5)
      return null;

    const toRankerFormat = (card) => {
      const rank = card.value === "0" ? "T" : card.value;
      const suit = card.suit.toLowerCase(); // S, H, D, C → s, h, d, c
      return rank + suit;
    };

    const cards = [...holeCards, ...board].map(toRankerFormat);

    try {
      const result = Ranker.getHand(cards);
      return result?.description || null;
    } catch (err) {
      console.warn("Ranker failed on cards:", cards, err);
      return null;
    }
  };
  const isPlayersTurn = currentTurnPlayerId === activePlayerId;
  const chatMessages = Object.values(messages)
    .flat()
    .filter((m) => m?.payload?.type === "chat")
    .map((m) => m.payload);

  const displayGameMessages = Object.values(messages)
    .flat()
    .filter((m) => m?.payload?.type === "displayGame")
    .map((m) => ({
      ...m.payload,
    }));

  useEffect(() => {
    if (!activePlayerId) return;
    if (holeCards.length > 0) return;

    const privateHandMsg = displayGameMessages.find(
      (m) =>
        m?.action === "privateHand" &&
        m?.playerId === activePlayerId &&
        Array.isArray(m?.hand)
    );

    if (privateHandMsg) {
      const parsed = privateHandMsg.hand.map(parseCard);
      setHoleCards(parsed);
    }
  }, [displayGameMessages, activePlayerId, holeCards]);

  function parseCard(code) {
    const value = code[0] === "T" ? "0" : code[0]; // "T" is stored as "0" in deckofcardsapi
    const suit = code[1].toUpperCase(); // e.g. "d" => "D"
    return {
      id: code,
      src: `https://deckofcardsapi.com/static/img/${value}${suit}.png`,
      value,
      suit,
    };
  }

  console.log("displayGameMessages ", displayGameMessages);

  console.log("currentTurnPlayerId ", currentTurnPlayerId);
  console.log("activePlayerId ", activePlayerId);
  console.log("playersAtTable ", playersAtTable);
  console.log("gameState ", gameState);
  console.log("playerBets ", playerBets);

  useEffect(() => {
    const msg = displayGameMessages[displayGameMessages.length - 1];
    if (!msg) return;

    const { action, playerId, seatIndex, playersAtTable: incomingSeats } = msg;

    if (Array.isArray(incomingSeats)) {
      const updatedSeats = Array(seatCount).fill(null);

      for (const entry of incomingSeats) {
        const { playerId, seatIndex } = entry;
        if (
          typeof seatIndex === "number" &&
          seatIndex < seatCount &&
          playerId
        ) {
          updatedSeats[seatIndex] = playerId;
        }
      }

      setPlayersAtTable((prev) => {
        const same =
          prev.length === updatedSeats.length &&
          prev.every((val, i) => val === updatedSeats[i]);

        return same ? prev : updatedSeats;
      });
      return;
    }

    if (action === "sit" && typeof seatIndex === "number") {
      setPlayersAtTable((prev) => {
        if (prev.includes(playerId)) return prev;
        const updated = [...prev];
        updated[seatIndex] = playerId;
        return updated;
      });
    }

    if (action === "leave") {
      setPlayersAtTable((prev) =>
        prev.map((id) => (id === playerId ? null : id))
      );
    }
  }, [displayGameMessages]);

  return (
    <div className="container-fluidpy-4">
      <div className="d-flex justify-content-center mt-4">
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
        />
      </div>
      {gameState.showdownWinner && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center"
          style={{ zIndex: 9999 }}
        >
          <div
            className="bg-white rounded p-4 shadow-lg text-center"
            style={{ maxWidth: "400px" }}
          >
            <h3 className="mb-3">🏆 Winner</h3>
            <p className="mb-2">
              <strong>
                {allPlayers.find((p) => p.id === gameState.showdownWinner)
                  ?.name || gameState.showdownWinner.slice(0, 6)}
              </strong>
            </p>
            <p className="text-muted">
              {
                gameState.showdownResults?.find(
                  (r) => r.id === gameState.showdownWinner
                )?.description
              }
            </p>
          </div>
        </div>
      )}

      <div className="d-flex flex-column align-items-center mt-5">
        <h2 className="text-center mb-3 mt-3">Demo Table</h2>

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
        <button
          type="button"
          className="btn btn-secondary mb-2"
          onClick={handleLeaveTable}
        >
          Leave Table
        </button>
        {/* <button
          type="button"
          className="btn btn-secondary mb-2"
          onClick={() => {
            setPlayersAtTable((prev) =>
              prev.map((id) => (id === activePlayerId ? null : id))
            );
            setPlayerBets((prev) => {
              const updated = { ...prev };
              delete updated[activePlayerId];
              return updated;
            });
          }}
        >
          Leave Table
        </button> */}

        <div
          className="mb-5"
          style={{ minHeight: "150px", maxHeight: "300px", overflowY: "auto" }}
        >
          {currentTurnPlayerId && (
            <div className="mb-3 text-center">
              <span className="badge bg-info text-dark">
                Turn:{" "}
                {allPlayers.find((p) => p.id === currentTurnPlayerId)?.name ||
                  currentTurnPlayerId.slice(0, 6)}
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
              ♠ POGN Game Board ♣
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
              Pot: ${potTotal}
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
              {gameState.communityCards.map((card, i) => (
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
              ))}

              {/* {faceUpCards.map((card) => (
                <img
                  key={card.id}
                  src={card.src}
                  alt={card.alt}
                  style={{
                    width: "clamp(30px, 7vw, 60px)",
                    height: "auto",
                    flexShrink: 0,
                  }}
                />
              ))} */}
            </div>
          </div>

          {Array(seatCount)
            .fill(null)
            .map((_, idx) => {
              const angle = (2 * Math.PI * idx) / seatCount - Math.PI / 2;
              const x = cx + (radiusX + seatOffsetX) * Math.cos(angle);
              const y = cy + (radiusY + seatOffsetY) * Math.sin(angle);

              const playerId = playersAtTable[idx];
              const playerObj = allPlayers.find((p) => p.id === playerId);

              return (
                <PlayerHUD
                  key={idx}
                  seatIndex={idx}
                  seatCount={seatCount}
                  playerId={playerId}
                  playerObj={playerObj}
                  currentBet={playerBets[playerId] || 0}
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
                  holeCards={holeCards}
                />
              );
            })}
        </div>

        {playersAtTable.includes(activePlayerId) && (
          <div className="w-50 d-flex mt-5 flex-column justify-content-end">
            {getPlayerHandRank() && (
              <div className="text-center my-3">
                <span className="badge bg-success">
                  You have: {getPlayerHandRank()}
                </span>
              </div>
            )}
            {/* Bet Input with +/- Buttons */}
            {/* <div className="w-100 mb-2 d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  setBetAmount((prev) => Math.max(minBet, prev - smallBlind))
                }
              >
                –
              </button>
              <input
                type="number"
                className="form-control"
                min={minBet}
                max={1000}
                step={smallBlind}
                value={betAmount}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  setBetAmount((prev) => Math.min(1000, prev + smallBlind))
                }
              >
                +
              </button>
            </div> */}
            {/* <div
              className="w-100 mb-2 d-flex align-items-center gap-2"
              style={{
                pointerEvents:
                  currentTurnPlayerId !== activePlayerId ? "none" : "auto",
                opacity: currentTurnPlayerId !== activePlayerId ? 0.5 : 1,
              }}
            >
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  setBetAmount((prev) => Math.max(minBet, prev - smallBlind))
                }
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
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  setBetAmount((prev) => Math.min(1000, prev + smallBlind))
                }
              >
                +
              </button>
            </div>

            <div
              className="btn-group mb-2 w-100 gap-2"
              role="group"
              aria-label="Action Buttons"
              style={{
                pointerEvents:
                  currentTurnPlayerId !== activePlayerId ? "none" : "auto",
                opacity: currentTurnPlayerId !== activePlayerId ? 0.5 : 1,
              }}
            >
              <button type="button" className="btn btn-secondary">
                Fold
              </button>
              <button type="button" className="btn btn-secondary">
                Check
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setPlayerBets((prev) => {
                    const newBets = {
                      ...prev,
                      [activePlayerId]: (prev[activePlayerId] || 0) + betAmount,
                    };
                    return newBets;
                  });

                  setPotTotal((prev) => prev + betAmount); // 💰 add bet to pot immediately

                  setPlayerStacks((prev) => ({
                    ...prev,
                    [activePlayerId]: Math.max(
                      0,
                      (prev[activePlayerId] || 0) - betAmount
                    ),
                  }));

                  setGameState((prev) => {
                    const activePlayers = playersAtTable.filter(Boolean);
                    const nextIndex = getNextTurnIndex(
                      prev.currentTurnIndex,
                      activePlayers
                    );
                    const updatedTurns = [...prev.turnsInRound, activePlayerId];
                    const uniqueTurns = new Set(updatedTurns);
                    const isRoundComplete =
                      uniqueTurns.size === activePlayers.length;

                    if (isRoundComplete) {
                      setTimeout(() => {
                        setPotTotal(
                          (prevPot) => prevPot + betsTotalRef.current
                        );
                        setBetsTotal(0);
                        setPlayerBets({});
                      }, 1000);
                    }

                    return {
                      ...prev,
                      currentTurnIndex: nextIndex,
                      turnsInRound: isRoundComplete ? [] : updatedTurns,
                      street: isRoundComplete
                        ? getNextStreet(prev.street)
                        : prev.street,
                      playerActions: {
                        ...prev.playerActions,
                        [activePlayerId]: {
                          action: "bet",
                          amount: betAmount,
                        },
                      },
                    };
                  });

                  setTimeout(() => {
                    setGameState((prev) => ({ ...prev }));
                  }, 0);
                }}
              >
                Bet {betAmount}
              </button>
            </div> */}
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
                      action: "fold",
                      playerId: activePlayerId,
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
                      action: "check",
                      playerId: activePlayerId,
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
                      action: "bet",
                      playerId: activePlayerId,
                      amount: betAmount,
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
    </div>
  );
};

export default GameTable;
