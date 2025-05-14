import React, { useState, useEffect, useRef } from "react";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";

const ChatWindow = ({
  playerId,
  sendMessage,
  messages,
  setPlayers,
  setActivePlayerId,
}) => {
  const [joined, setJoined] = useState(false);
  const [input, setInput] = useState("");

  const generatedIdRef = useRef(null);

  useEffect(() => {
    if (!playerId && joined && !generatedIdRef.current) {
      const sk = generateSecretKey();
      const pk = getPublicKey(sk);
      const newId = pk;
      generatedIdRef.current = newId;
      setPlayers?.((prev) =>
        prev.some((p) => p.id === newId)
          ? prev
          : [...prev, { id: newId, pubkeySource: "guest" }]
      );
      setActivePlayerId?.(newId);
    }
  }, [joined, playerId]);

  const idToUse = playerId || generatedIdRef.current;

  const handleJoin = () => {
    setJoined(true);
  };

  useEffect(() => {
    if (joined && idToUse) {
      sendMessage({ id: "system", text: `${idToUse} joined chat.` });
    }
  }, [joined, idToUse]);

  const handleSend = () => {
    if (!input.trim() || !idToUse) return;
    sendMessage({ id: idToUse, text: input });
    setInput("");
  };

  // useEffect(() => {
  //   if (joined) {
  //     sendMessage({ id: "system", text: `${playerId} joined chat.` });
  //   }
  // }, [joined]);

  // const handleSend = () => {
  //   if (!input.trim()) return;
  //   sendMessage({ id: playerId, text: input });
  //   setInput("");
  // };

  return (
    <div
      className="d-flex flex-column align-items-center mt-4 w-100"
      style={{ maxWidth: 500 }}
    >
      <div
        className="w-100 border border-black rounded p-2 mb-2"
        style={{
          height: 300,
          overflowY: "auto",
          background: "#f8f9fa",
          wordWrap: "break-word",
          whiteSpace: "normal",
        }}
      >
        {(messages || []).map((msg, i) => (
          <div key={i}>
            {msg.id === "system" ? (
              <em className="text-muted d-block text-center">{msg.text}</em>
            ) : (
              <strong>{msg.id === playerId ? "You" : msg.id}</strong> +
              `: ${msg.text}`
            )}
          </div>
        ))}
      </div>

      <div className="col d-grid gap-2 w-100">
        {!joined && (
          <button className="btn btn-secondary" onClick={handleJoin}>
            Join Chat
          </button>
        )}

        {joined && (
          <>
            <input
              type="text"
              className="form-control"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <button className="btn btn-secondary" onClick={handleSend}>
              Send
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
