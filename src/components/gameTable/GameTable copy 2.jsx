import React, { useState, useRef, useEffect, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./gameTable.css";
import PlayerHUD from "./PlayerHUD";
import { getTurnPlayer } from "./pokerUtils";
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

  const displayGameMessages = useMemo(
    () =>
      Object.values(messages)
        .flat()
        .filter((m) => m?.payload?.type === "displayGame")
        .map((m) => m.payload),
    [messages]
  );

  useEffect(() => {
    if (!activePlayerId) return;
    console.log("Display game messages:", displayGameMessages);
    const privateHandMsg = [...displayGameMessages]
      .reverse()
      .find(
        (m) => m?.action === "privateHand" && m?.playerId === activePlayerId
      );

    if (privateHandMsg) {
      const parsedHands = {};
      for (const [pid, hand] of Object.entries(privateHandMsg.hands)) {
        parsedHands[pid] = Array.isArray(hand)
          ? hand.map((card) => (card ? parseCard(card) : null))
          : [];
      }
      setPlayerHands(parsedHands);
      setHoleCards(parsedHands[activePlayerId] || []);
    }
  }, [displayGameMessages, activePlayerId]);

  useEffect(() => {
    const msg = displayGameMessages[displayGameMessages.length - 1];
    console.log("Processing displayGame message:", msg);
    if (!msg) return;
    const {
      action,
      playerId,
      seatIndex,
      playersAtTable: incomingSeats,
      gameState: newGameState,
    } = msg;

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
      setPlayersAtTable(updatedSeats);
    }

    if (newGameState?.players) {
      const stackMap = {};
      for (const [pid, pdata] of Object.entries(newGameState.players)) {
        stackMap[pid] = pdata.stack;
      }
      setPlayerStacks(stackMap);
      setGameState((prev) => ({ ...prev, ...newGameState }));
    }
  }, [displayGameMessages, seatCount]);

  function parseCard(code) {
    const value = code[0] === "T" ? "0" : code[0];
    const suit = code[1].toUpperCase();
    return {
      id: code,
      src: `https://deckofcardsapi.com/static/img/${value}${suit}.png`,
      value,
      suit,
    };
  }

  const { width, height } = tableSize;
  const cx = width / 2;
  const cy = height / 2;
  const radiusX = width / 2;
  const radiusY = height / 2;
  const seatOffsetX = radiusX * CONFIG.seatPaddingRatio;
  const seatOffsetY = radiusY * CONFIG.seatPaddingRatio;

  const allPlayers = players;

  return (
    <div
      ref={tableRef}
      className="gameTableDiv position-relative mb-5 px-4"
      style={{
        width: "85%",
        maxWidth: "900px",
        aspectRatio: CONFIG.tableRatio,
      }}
    >
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
              currentBet={gameState?.players?.[playerId]?.bet || 0}
              isDealer={playerId === playersAtTable[gameState.dealerIndex]}
              seat={{
                top: (y / height) * 100,
                left: (x / width) * 100,
              }}
              onClick={() => {
                if (!playerId && activePlayerId) {
                  sendMessage("displayGame", {
                    relayId: "displayGame",
                    payload: {
                      type: "displayGame",
                      action: "sit",
                      playerId: activePlayerId,
                      seatIndex: idx,
                    },
                  });
                }
              }}
              gameState={gameState}
              isCurrentTurn={
                playerId ===
                getTurnPlayer(
                  playersAtTable.filter(Boolean),
                  gameState.currentTurnIndex
                )
              }
              stack={playerStacks[playerId] || 0}
              holeCards={playerHands[playerId] || []}
            />
          );
        })}
    </div>
  );
};

export default GameTable;
