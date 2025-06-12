import { useState, useEffect } from "react";

export function useGameState(displayGameMessages, activePlayerId, seatCount) {
  const [playersAtTable, setPlayersAtTable] = useState([]);
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
  const [playerHands, setPlayerHands] = useState({});
  const [holeCards, setHoleCards] = useState([]);
  const [winnerOverlayId, setWinnerOverlayId] = useState(null);

  const parseCard = (code) => {
    if (!code || typeof code !== "string") return null;
    if (code === "X") {
      return {
        id: "X",
        src: "https://deckofcardsapi.com/static/img/back.png",
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
  };

  useEffect(() => {
    const latest = [...displayGameMessages].reverse().find((m) => m?.hands);
    if (!latest) return;

    const parsedHands = {};
    for (const [pid, hand] of Object.entries(latest.hands)) {
      parsedHands[pid] = Array.isArray(hand)
        ? hand.map((card) => (card ? parseCard(card) : null))
        : [];
    }
    setPlayerHands(parsedHands);

    const myHand = Array.isArray(latest.hand) ? latest.hand.map(parseCard) : [];
    setHoleCards(myHand);
  }, [displayGameMessages, activePlayerId]);

  useEffect(() => {
    const msg = displayGameMessages[displayGameMessages.length - 1];
    if (!msg) return;

    const {
      playersAtTable: incomingSeats,
      gameState: newGameState,
      showdownWinner,
      showdownResults,
      revealedHands,
    } = msg;

    if (Array.isArray(incomingSeats)) {
      const updatedSeats = Array(seatCount).fill(null);
      for (const { playerId, seatIndex } of incomingSeats) {
        if (
          typeof seatIndex === "number" &&
          playerId &&
          seatIndex < seatCount
        ) {
          updatedSeats[seatIndex] = { playerId, seatIndex };
        }
      }
      setPlayersAtTable((prev) => {
        const same =
          prev.length === updatedSeats.length &&
          prev.every((val, i) => val?.playerId === updatedSeats[i]?.playerId);
        return same ? prev : updatedSeats;
      });
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

    if (revealedHands) {
      const parsed = {};
      for (const { playerId, hand } of revealedHands) {
        parsed[playerId] = hand.map(parseCard);
      }
      setPlayerHands(parsed);
    }
  }, [displayGameMessages, seatCount]);

  return {
    playersAtTable,
    gameState,
    playerStacks,
    playerHands,
    holeCards,
    winnerOverlayId,
    setWinnerOverlayId,
    setPlayersAtTable,
  };
}
