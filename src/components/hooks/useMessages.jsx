import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

export default function useMessages(
  playerId,
  connections,
  sendMessageToUrl,
  setAddRelayConnections,
  setRemoveRelayConnections
) {
  const [messages, setMessages] = useState({});
  const [sentMessages, setSentMessages] = useState({});
  const [lobbyMessages, setLobbyMessages] = useState({});
  const [gameMessages, setGameMessages] = useState({});

  const handleSendMessage = useCallback(
    (id, message) => {
      console.log(`📤 Sending message to ${id}`, message);
      const connection = connections.get(id);
      if (!connection) {
        console.warn(`⚠️ Connection ${id} not found`);
        return;
      }
      if (connection.readyState !== 1) {
        console.warn(`⚠️ Connection ${id} not ready`);
        return;
      }

      if (!message?.payload) {
        console.warn(`⚠️ Message payload is missing`, message);
        return;
      }

      message.uuid = uuidv4();
      message.relayId = id;
      message.payload.playerId = playerId;

      console.log(`🚀 Sending message to ${id}`, message);
      sendMessageToUrl(id, message);
      setSentMessages((prev) => {
        const updated = { ...prev };
        if (!updated[id]) {
          updated[id] = [];
        }
        updated[id].push(message);
        return updated;
      });
    },
    [connections, playerId, sendMessageToUrl]
  );

  const handleMessage = useCallback(
    (id, message) => {
      console.log(`📩 Message received from ${id}`, message);
      if (!message?.payload) {
        console.warn(`⚠️ Message payload is missing`, message);
        return;
      }

      setMessages((prev) => ({
        ...prev,
        [id]: [...(prev[id] || []), message],
      }));

      const { type, lobbyId, gameId, action, lobbyAddress, errorMessage } =
        message.payload;
      if (errorMessage) {
        console.log("Error message received:", errorMessage);
        console.log("Message payload:", message.payload);
        console.log("Message:", message);
        // console.warn(`⚠️ Error message received from ${id}:`, message.payload);
        let msg = message.payload.errorMessage;
        console.error(`⚠️ Error message received from ${id}:`, msg);
        alert(`⚠️ Error message received from ${id}: ${errorMessage}`);

        return;
      }
      if (type === "lobby") {
        if (action === "inviteVerified"|| action === "gameInviteError") {
          console.log("Game inviteVerified ignored:", message.payload);
          return;
        }
        if (action === "newLobby" && lobbyId && lobbyAddress) {
          setRemoveRelayConnections((prev) =>
            prev.filter((conn) => conn.id !== lobbyId)
          );
          setAddRelayConnections((prev) => [
            ...prev,
            { id: lobbyId, url: lobbyAddress, type: "lobby" },
          ]);
          return;
        }

        setLobbyMessages((prev) => {
          const existing = prev[lobbyId] || [];
          if (existing[existing.length - 1]?.uuid === message.uuid) return prev;
          return {
            ...prev,
            [lobbyId]: [...existing, message],
          };
        });
        return;
      }

      if (type === "game") {
        setGameMessages((prev) => ({
          ...prev,
          [gameId]: [...(prev[gameId] || []), message],
        }));
        return;
      }

      console.warn(`⚠️ Unknown message type received from ${id}:`, message);
    },
    [setAddRelayConnections, setRemoveRelayConnections]
  );

  return {
    messages,
    sentMessages,
    lobbyMessages,
    gameMessages,
    handleMessage,
    handleSendMessage,
  };
}
