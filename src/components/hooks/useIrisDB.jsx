// hooks/useIrisDB.jsx
import { useLocalState } from "irisdb-hooks";
import { useEffect } from "react";
import { useNostrExtensionKey } from "./useNostrExtensionKey";
export const useIrisPlayerId = (relayId, wsUrl) => {
  const [playerId, setPlayerId] = useLocalState("pogn/playerId", "");
  // const [rawPlayerId, _setPlayerId] = useLocalState("pogn/playerId", "");

  // const playerId =
  //   typeof rawPlayerId === "string" ? rawPlayerId : String(rawPlayerId || "");
  // const setPlayerId = (val) =>
  //   _setPlayerId(typeof val === "string" ? val : String(val || ""));
  // const { nostrPubkey } = useNostrExtensionKey();

  // useEffect(() => {
  //   if (!playerId || !wsUrl.startsWith("ws")) return;
  //   if (playerId !== nostrPubkey) {
  //     console.log("🧽 Not NOSTR public key");
  //     return;
  //   }

  //   const ws = new WebSocket(wsUrl);

  //   ws.onopen = () => {
  //     console.log("🔌 WebSocket open to", wsUrl);

  //     const nostrEvent = {
  //       kind: 1,
  //       created_at: Math.floor(Date.now() / 1000),
  //       content: playerId,
  //       pubkey: playerId, // mock as pubkey
  //       tags: [
  //         ["t", "pogn/playerId"],
  //         ["relayId", relayId],
  //       ],
  //       id: crypto.randomUUID(), // mock ID
  //       sig: "0".repeat(128), // mock sig
  //     };

  //     const message = ["EVENT", nostrEvent];
  //     console.log("📤 Sending mocked Nostr event to relay:", message);
  //     //  ws.send(JSON.stringify(message));
  //   };

  //   ws.onerror = (err) => {
  //     console.warn("❌ WebSocket error:", err);
  //   };

  //   return () => {
  //     ws.close();
  //   };
  // }, [playerId, wsUrl, relayId]);

  return [playerId, setPlayerId];
};
