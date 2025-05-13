import React, { useState, useEffect } from "react";

const ChatWindow = ({ playerId, sendMessage, messages }) => {
  const [joined, setJoined] = useState(false);
  const [input, setInput] = useState("");

  const handleJoin = () => {
    setJoined(true);
  };

  useEffect(() => {
    if (joined) {
      sendMessage({ id: "system", text: `${playerId} joined chat.` });
    }
  }, [joined]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage({ id: playerId, text: input });
    setInput("");
  };

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
            <strong>{msg.id === playerId ? "You" : msg.id}</strong>: {msg.text}
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
