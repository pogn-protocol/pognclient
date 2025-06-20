import React, { useEffect, useState, useCallback, useRef } from "react";
import useWebSocket from "react-use-websocket";
import { v4 as uuid } from "uuid";

const RelayItem = ({
  id,
  url,
  type,
  onMessage,
  setConnections,
  closingConnections,
  setRemoveRelayConnections,
  manualCloseRef,
  selectedRelayId,
  setSelectedRelayId,
}) => {
  const [prevMessage, setPrevMessage] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const [countdown, setCountdown] = useState(null);
  const [ring, setRing] = useState(false);

  const isSelected = selectedRelayId === id;

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(url, {
    //shouldReconnect: () => !manualCloseRef.current,

    shouldReconnect: () => {
      // defensive check to prevent crashing if manualCloseRef is undefined
      return !(manualCloseRef && manualCloseRef.current);
    },

    reconnectAttempts: 5,
    reconnectInterval: 3000,
    share: true,
  });

  // 🔁 Update connection in global map
  const updateConnection = useCallback(() => {
    setConnections((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(id) || {};
      newMap.set(id, {
        ...existing,
        sendJsonMessage,
        readyState,
        url,
        type,
        customReadyState:
          readyState === 3 && !closingConnections.has(id) ? 4 : readyState,
      });
      return newMap;
    });
  }, [
    id,
    url,
    type,
    sendJsonMessage,
    readyState,
    setConnections,
    closingConnections,
    manualCloseRef,
    selectedRelayId,
    setSelectedRelayId,
  ]);

  useEffect(() => {
    updateConnection();

    if (readyState === 1) {
      clearTimeout(reconnectTimeoutRef.current);
    } else if (readyState === 3 && !closingConnections.has(id)) {
      reconnectTimeoutRef.current = setTimeout(() => {
        setConnections((prev) => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      }, 10000);
    }
  }, [readyState, updateConnection]);

  useEffect(() => {
    if (lastJsonMessage && lastJsonMessage?.uuid !== prevMessage?.uuid) {
      console.log("Received message from relay:", id, lastJsonMessage);
      console.log("Previous message:", prevMessage);
      if (lastJsonMessage.relayId !== id) {
        console.warn(
          `⚠️ Message from relay ${id} does not match the current relayId  ${lastJsonMessage.relayId}. Ignoring.`
        );
        return;
      }
      if (lastJsonMessage && !lastJsonMessage.uuid) {
        console.warn("⚠️ Message from relay does not have a uuid. Adding one.");
        lastJsonMessage.uuid = uuid();
      }
      console.log("Setting message:", lastJsonMessage);
      setPrevMessage(lastJsonMessage);

      onMessage(id, lastJsonMessage);

      if (
        lastJsonMessage &&
        lastJsonMessage.payload?.type === "pong" &&
        lastJsonMessage.relayId === id
      ) {
        setRing(true);
        setTimeout(() => setRing(false), 600);
      }
    }
  }, [lastJsonMessage, id, onMessage, prevMessage]);

  useEffect(() => {
    if (!closingConnections.has(id)) return;

    setCountdown(closingConnections.get(id)?.countdown || 5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [closingConnections, id]);

  return (
    <div
      className={`relay-item flex flex-col items-center px-3 py-2 rounded-md cursor-pointer gap-1 w-fit text-sm transition 
    ${
      isSelected
        ? "border-2 border-green-500 bg-green-100 shadow-sm"
        : "border border-gray-300 bg-white hover:bg-gray-50"
    }`}
      onClick={() => {
        setSelectedRelayId((prev) => (prev === id ? null : id));
      }}
    >
      <div
        className="text-lg"
        title="Click to disconnect"
        onClick={(e) => {
          e.stopPropagation();
          setRemoveRelayConnections((prev) => [...prev, id]);
        }}
      >
        {closingConnections.has(id)
          ? `🛑 ${countdown}s`
          : readyState === 1
          ? "✅"
          : readyState === 0
          ? "🟡"
          : readyState === 3
          ? "🔴"
          : readyState === 4
          ? "🟠"
          : "⚪️"}
      </div>

      <span className="text-xs text-center break-words max-w-[120px]">
        {id}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log("Sending ping to relay:", id, url, type);
          sendJsonMessage({
            relayId: id,
            uuid: uuid(),
            payload: { type: "ping", message: id },
          });
        }}
        className={`text-xs px-2 py-1 rounded-md transition-all duration-150 mt-1
      ${
        ring
          ? "animate-bounce bg-green-500 text-white"
          : "bg-blue-500 hover:bg-blue-600 text-white"
      }`}
      >
        {ring ? "Pong! 🛎️" : "Ping"}
      </button>
    </div>
  );
};

export default RelayItem;
