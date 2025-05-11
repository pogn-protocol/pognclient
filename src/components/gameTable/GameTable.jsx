import React, { useState, useRef, useEffect, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./gameTable.css";
import PlayerHUD from "./PlayerHUD";
import { getTurnPlayer, getNextTurnIndex, getNextStreet } from "./pokerUtils";
import Ranker from "handranker";

const CONFIG = {
  seatCountMin: 2,
  seatCountMax: 9,
  seatPaddingRatio: 0.1,
  tableRatio: 2 / 1,
};

const GameTable = ({ activePlayerId, players = [], nostrProfileData }) => {
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
    playerHands: {}, // { playerId: [card1, card2] }
    deck: [], // current shuffled deck
    blindsPosted: false,
  });
  const [playerStacks, setPlayerStacks] = useState({});
  const [betsTotal, setBetsTotal] = useState(0);
  const betsTotalRef = useRef(0);

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

  function initializeDeck() {
    const suits = ["S", "H", "D", "C"];
    const values = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "J",
      "Q",
      "K",
    ];
    const deck = [];

    for (let s of suits) {
      for (let v of values) {
        deck.push({
          id: v + s,
          src: `https://deckofcardsapi.com/static/img/${v + s}.png`,
          value: v,
          suit: s,
        });
      }
    }

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // const tenOfSpades = {
    //   id: "10S",
    //   src: `https://deckofcardsapi.com/static/img/0S.png`,
    //   alt: "10 of Spades",
    //   value: "0",
    //   suit: "S",
    // };

    // deck.unshift(tenOfSpades); // force it as first flop card

    return deck;
  }

  function startNewHand() {
    const deck = initializeDeck();
    const newHands = {};
    const activePlayers = playersAtTable.filter(Boolean);

    if (activePlayers.length < 2) return;

    // Deal hands
    for (let id of activePlayers) {
      newHands[id] = [deck.pop(), deck.pop()];
    }

    const nextDealerIndex = (gameState.dealerIndex + 1) % activePlayers.length;
    const dealerIndex = nextDealerIndex;

    // Determine blind positions based on player count
    let sbIndex, bbIndex, firstToActIndex;
    let sbId, bbId;
    const sbAmount = 10;
    const bbAmount = 20;
    console.log("💡 DEALER:", dealerIndex, activePlayers[dealerIndex]);
    console.log(
      "💡 FIRST TO ACT:",
      firstToActIndex,
      activePlayers[firstToActIndex]
    );
    console.log("💡 ACTIVE PLAYERS:", activePlayers);
    if (activePlayers.length === 2) {
      // Heads-up: dealer is SB, other player is BB
      sbIndex = dealerIndex;
      bbIndex = (dealerIndex + 1) % activePlayers.length;
      // In heads-up, SB acts first preflop
      firstToActIndex = sbIndex;
    } else if (activePlayers.length === 3) {
      // 3-handed game: SB left of dealer, BB left of SB
      sbIndex = (dealerIndex + 1) % activePlayers.length;
      bbIndex = (dealerIndex + 2) % activePlayers.length;
      // In 3-handed, dealer/button acts first preflop
      firstToActIndex = dealerIndex;
    } else {
      // 4+ players: SB left of dealer, BB left of SB
      sbIndex = (dealerIndex + 1) % activePlayers.length;
      bbIndex = (dealerIndex + 2) % activePlayers.length;
      // UTG (Under the Gun) - first position after BB acts first preflop
      firstToActIndex = (dealerIndex + 3) % activePlayers.length;
    }
    console.log("💡 DEALER:", dealerIndex, activePlayers[dealerIndex]);
    console.log(
      "💡 FIRST TO ACT:",
      firstToActIndex,
      activePlayers[firstToActIndex]
    );
    console.log("💡 ACTIVE PLAYERS:", activePlayers);
    sbId = activePlayers[sbIndex];
    bbId = activePlayers[bbIndex];
    console.log("💡 SB:", sbId);
    console.log("💡 BB:", bbId);
    // Deduct blinds from stacks
    setPlayerStacks((prev) => ({
      ...prev,
      [sbId]: Math.max(0, (prev[sbId] || 0) - sbAmount),
      [bbId]: Math.max(0, (prev[bbId] || 0) - bbAmount),
    }));

    // Record blind bets
    setPlayerBets({
      [sbId]: sbAmount,
      [bbId]: bbAmount,
    });

    // Set initial pot
    setPotTotal(sbAmount + bbAmount);

    // Track blind actions
    const playerActions = {
      [sbId]: { action: "blind", amount: sbAmount },
      [bbId]: { action: "blind", amount: bbAmount },
    };

    // Update game state
    setGameState((prev) => ({
      ...prev,
      dealerIndex,
      currentTurnIndex: firstToActIndex,
      deck,
      communityCards: [],
      playerHands: {}, // fill after
      turnsInRound: [sbId, bbId],
      street: "preflop",
      playerActions,
      blindsPosted: true,
    }));

    // Add slight delay before dealing cards to players
    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        playerHands: newHands,
      }));
    }, 0);
  }

  // function startNewHand() {
  //   const deck = initializeDeck();
  //   const newHands = {};
  //   const activePlayers = playersAtTable.filter(Boolean);

  //   if (activePlayers.length < 2) return;

  //   for (let id of activePlayers) {
  //     newHands[id] = [deck.pop(), deck.pop()];
  //   }

  //   const nextDealerIndex = (gameState.dealerIndex + 1) % playersAtTable.length;

  //   let sbIndex, bbIndex;
  //   // if (activePlayers.length === 2) {
  //   //   sbIndex = nextDealerIndex;
  //   //   bbIndex = (nextDealerIndex + 1) % playersAtTable.length;
  //   // } else {
  //   //   sbIndex = (nextDealerIndex + 1) % playersAtTable.length;
  //   //   bbIndex = (nextDealerIndex + 2) % playersAtTable.length;
  //   // }
  //   if (activePlayers.length === 2) {
  //     sbIndex = nextDealerIndex;
  //     bbIndex = (nextDealerIndex + 1) % playersAtTable.length;
  //   } else {
  //     sbIndex = nextDealerIndex; // dealer = SB
  //     bbIndex = (nextDealerIndex + 1) % playersAtTable.length;
  //   }

  //   const sbId = playersAtTable[sbIndex];
  //   const bbId = playersAtTable[bbIndex];
  //   const sbAmount = 10;
  //   const bbAmount = 20;

  //   // Deduct from stacks and set bets
  //   setPlayerStacks((prev) => ({
  //     ...prev,
  //     [sbId]: Math.max(0, (prev[sbId] || 0) - sbAmount),
  //     [bbId]: Math.max(0, (prev[bbId] || 0) - bbAmount),
  //   }));

  //   setPlayerBets({
  //     [sbId]: sbAmount,
  //     [bbId]: bbAmount,
  //   });

  //   setPotTotal(sbAmount + bbAmount);

  //   setGameState((prev) => ({
  //     ...prev,
  //     dealerIndex: nextDealerIndex,
  //     currentTurnIndex: (bbIndex + 1) % playersAtTable.length,
  //     deck,
  //     communityCards: [],
  //     playerHands: {}, // filled next
  //     turnsInRound: [sbId, bbId],
  //     street: "preflop",
  //     playerActions: {
  //       [sbId]: { action: "blind", amount: sbAmount },
  //       [bbId]: { action: "blind", amount: bbAmount },
  //     },
  //     blindsPosted: true,
  //   }));

  //   setTimeout(() => {
  //     setGameState((prev) => ({
  //       ...prev,
  //       playerHands: newHands,
  //     }));
  //   }, 0);
  // }

  const botId = "pokerBot";
  const secondBotId = "pokerBot2";

  const allPlayers = useMemo(() => {
    const bot1 = { id: botId, name: "Bot" };
    const bot2 = { id: secondBotId, name: "Bot 2" };
    const filtered = players.filter(
      (p) => p.id !== botId && p.id !== secondBotId
    );
    return [...filtered, bot1, bot2];
  }, [players]);

  useEffect(() => {
    const validPlayers = playersAtTable.filter(Boolean);
    const unique = Array.from(new Set(validPlayers)).slice(0, seatCount);

    const botIds = ["pokerBot", "pokerBot2"];
    const updated = [...unique];

    for (const botId of botIds) {
      if (!updated.includes(botId) && updated.length < seatCount) {
        updated.push(botId);
      }
    }

    setPlayersAtTable(updated);
  }, [seatCount]);

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

  const handleSitInternal = (idx) => {
    setPlayersAtTable((prev) => {
      if (prev.includes(activePlayerId)) return prev;
      const updated = [...prev];
      updated[idx] = activePlayerId;
      return updated;
    });
  };

  const handleLeaveTable = () => {
    if (!activePlayerId) return;
    setPlayersAtTable((prev) =>
      prev.map((id) => (id === activePlayerId ? null : id))
    );
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
    setPlayersAtTable((prev) => {
      const updated = [...prev];

      const ids = new Set(updated);
      if (!ids.has(botId)) {
        const emptyIndex = updated.findIndex((id) => !id);
        if (emptyIndex !== -1) updated[emptyIndex] = botId;
      }

      if (!ids.has(secondBotId)) {
        const emptyIndex = updated.findIndex((id) => !id);
        if (emptyIndex !== -1) updated[emptyIndex] = secondBotId;
      }

      return updated.slice(0, seatCount);
    });
  }, []);

  const botActedRef = useRef({});

  const botIds = [botId, secondBotId];

  useEffect(() => {
    const activePlayers = playersAtTable.filter(Boolean);
    if (activePlayers.length < 3) return;

    const currentTurnPlayerId = getTurnPlayer(
      activePlayers,
      gameState.currentTurnIndex
    );

    console.log("BOT TURN CHECK", {
      currentTurnIndex: gameState.currentTurnIndex,
      currentTurnPlayerId,
      dealerId: activePlayers[gameState.dealerIndex],
      activePlayers,
    });

    if (
      botIds.includes(currentTurnPlayerId) &&
      !botActedRef.current[currentTurnPlayerId]
    ) {
      botActedRef.current[currentTurnPlayerId] = true;

      const botBet = smallBlind;

      setTimeout(() => {
        setPlayerBets((prev) => ({
          ...prev,
          [currentTurnPlayerId]: (prev[currentTurnPlayerId] || 0) + botBet,
        }));

        setPotTotal((prev) => prev + botBet);

        setPlayerStacks((prev) => ({
          ...prev,
          [currentTurnPlayerId]: Math.max(
            0,
            (prev[currentTurnPlayerId] || 0) - botBet
          ),
        }));

        setGameState((prev) => {
          const activePlayers = playersAtTable.filter(Boolean);
          const nextIndex = getNextTurnIndex(
            prev.currentTurnIndex,
            activePlayers
          );
          const updatedTurns = [...prev.turnsInRound, currentTurnPlayerId];
          const uniqueTurns = new Set(updatedTurns);
          const isRoundComplete = uniqueTurns.size === activePlayers.length;

          if (isRoundComplete) {
            setTimeout(() => {
              setPotTotal((prevPot) => prevPot + betsTotalRef.current);
              setBetsTotal(0);
              setPlayerBets({});
            }, 1000);
          }

          return {
            ...prev,
            currentTurnIndex: nextIndex,
            turnsInRound: isRoundComplete ? [] : updatedTurns,
            street: isRoundComplete ? getNextStreet(prev.street) : prev.street,
            playerActions: {
              ...prev.playerActions,
              [currentTurnPlayerId]: {
                action: "bet",
                amount: botBet,
              },
            },
          };
        });
      }, 1000);
    }

    if (!botIds.includes(currentTurnPlayerId)) {
      botIds.forEach((id) => (botActedRef.current[id] = false));
    }
  }, [gameState, playersAtTable]);

  useEffect(() => {
    const activePlayers = playersAtTable.filter(Boolean);
    if (activePlayers.length >= 3 && gameState.deck.length === 0) {
      startNewHand();
    }
  }, [playersAtTable, gameState.deck.length]);

  useEffect(() => {
    if (gameState.street === "flop" && gameState.communityCards.length === 0) {
      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          communityCards: prev.deck.slice(0, 3),
          deck: prev.deck.slice(3),
        }));
      }, 0);
    } else if (
      gameState.street === "turn" &&
      gameState.communityCards.length === 3
    ) {
      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          communityCards: [...prev.communityCards, prev.deck[0]],
          deck: prev.deck.slice(1),
        }));
      }, 0);
    } else if (
      gameState.street === "river" &&
      gameState.communityCards.length === 4
    ) {
      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          communityCards: [...prev.communityCards, prev.deck[0]],
          deck: prev.deck.slice(1),
        }));
      }, 0);
    } else if (
      gameState.street === "showdown" &&
      gameState.communityCards.length === 5
    ) {
      const board = gameState.communityCards.map((c) => {
        const r = c.value === "0" ? "T" : c.value;
        return r + c.suit.toLowerCase();
      });

      const hands = Object.entries(gameState.playerHands).map(
        ([playerId, hand]) => ({
          id: playerId,
          cards: hand.map((c) => {
            const r = c.value === "0" ? "T" : c.value;
            return r + c.suit.toLowerCase();
          }),
        })
      );

      const result = Ranker.orderHands(hands, board);
      const flat = result.flat();
      const winner = flat[0];
      const payout = potTotal;
      console.log("🏆 Winner:", winner.id);
      console.log("💰 Payout:", payout);
      console.log("🧾 Stacks before:", playerStacks);

      setGameState((prev) => ({
        ...prev,
        showdownResults: flat,
        showdownWinner: winner.id,
      }));

      setTimeout(() => {
        setPlayerStacks((prev) => {
          const updated = {
            ...prev,
            [winner.id]: (prev[winner.id] || 0) + payout,
          };
          console.log("✅ New stacks:", updated);
          return updated;
        });
        setGameState((prev) => ({
          ...prev,
          communityCards: [],
          playerHands: {},
          turnsInRound: [],
          playerActions: {},
          showdownResults: [],
          showdownWinner: null,
          street: "reset",
        }));
        setPlayerBets({});
        setPotTotal(0);
        setTimeout(() => {
          startNewHand();
        }, 500);
      }, 2000);
    }
  }, [gameState.street]);

  const getPlayerHandRank = () => {
    const playerHand = gameState.playerHands[activePlayerId] || [];
    const board = gameState.communityCards || [];

    if (playerHand.length < 2 || board.length + playerHand.length < 5)
      return null;

    const toRankerFormat = (card) => {
      const rank = card.value === "0" ? "T" : card.value;
      const suit = card.suit.toLowerCase(); // S, H, D, C → s, h, d, c
      return rank + suit;
    };

    const cards = [...playerHand, ...board].map(toRankerFormat);

    try {
      const result = Ranker.getHand(cards);
      return result?.description || null;
    } catch (err) {
      console.warn("Ranker failed on cards:", cards, err);
      return null;
    }
  };
  const isPlayersTurn = currentTurnPlayerId === activePlayerId;

  console.log("currentTurnPlayerId ", currentTurnPlayerId);
  console.log("activePlayerId ", activePlayerId);
  console.log("playersAtTable ", playersAtTable);
  console.log("gameState ", gameState);
  console.log("playerBets ", playerBets);
  return (
    <div className="container-fluid py-4">
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

      <div className="d-flex flex-column align-items-center">
        <h2 className="text-center mb-3">Demo Table</h2>

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
        </button>

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
                      (!playerId || playerId === activePlayerId) &&
                      activePlayerId
                    ) {
                      handleSitInternal(idx);
                    }
                  }}
                  gameState={gameState}
                  isCurrentTurn={playerId === currentTurnPlayerId}
                  stack={playerStacks[playerId] || 0}
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
            <div
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
