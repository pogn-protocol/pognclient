import { useState, useEffect } from "react";
import { generatePrivateKey, getPublicKey } from "nostr-tools";

const Player = ({ setPlayerId }) => {
  const [privateKey, setPrivateKey] = useState(() => {
    const storedKey = localStorage.getItem("nostrPrivateKey");
    if (storedKey) {
      console.log("🔑 Loaded private key from localStorage.");
      return storedKey;
    }
    const newKey = generatePrivateKey();
    localStorage.setItem("nostrPrivateKey", newKey);
    console.log("🆕 Generated and stored new private key.");
    return newKey;
  });

  const [playerId, setPlayerIdState] = useState(() => {
    const storedId = localStorage.getItem("nostrPublicKey");
    if (storedId) {
      console.log("🧠 Loaded playerId from localStorage.");
      return storedId;
    }
    const derived = getPublicKey(privateKey);
    localStorage.setItem("nostrPublicKey", derived);
    return derived;
  });

  useEffect(() => {
    if (setPlayerId && playerId) {
      setPlayerId(playerId);
    }
  }, [setPlayerId, playerId]);

  const handleChange = (e) => {
    const newId = e.target.value.trim();
    setPlayerIdState(newId);
    localStorage.setItem("nostrPublicKey", newId);
    if (setPlayerId) setPlayerId(newId);
  };

  return (
    <div className="mb-3">
      <label className="form-label">Player ID (Public Key):</label>
      <input
        type="text"
        className="form-control"
        value={playerId}
        onChange={handleChange}
        placeholder="Enter your Nostr public key..."
        style={{ fontFamily: "monospace", fontSize: "0.9em" }}
      />
      <div className="form-text">
        Your public key will be stored in <code>localStorage</code>.
        Auto-generated if empty.
      </div>
    </div>
  );
};

export default Player;
