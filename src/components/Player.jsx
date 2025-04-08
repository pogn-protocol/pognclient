import { useState, useEffect } from "react";
import { generatePrivateKey, getPublicKey } from "nostr-tools";

const Player = ({ setPlayerId }) => {
  const [privateKey, setPrivateKey] = useState(() => {
    const storedKey = sessionStorage.getItem("nostrPrivateKey");
    if (storedKey) {
      console.log("🔑 Loaded private key from sessionStorage.");
      return storedKey;
    }
    const newKey = generatePrivateKey();
    sessionStorage.setItem("nostrPrivateKey", newKey);
    console.log("🆕 Generated and stored new private key.");
    return newKey;
  });

  const [playerId, setPlayerIdState] = useState(() => {
    const storedId = sessionStorage.getItem("nostrPublicKey");
    if (storedId) {
      console.log("🧠 Loaded playerId from sessionStorage.");
      return storedId;
    }
    const derived = getPublicKey(privateKey);
    sessionStorage.setItem("nostrPublicKey", derived);
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
    sessionStorage.setItem("nostrPublicKey", newId);
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
        Your public key will be stored in <code>sessionStorage</code>.
        Auto-generated if empty.
      </div>
    </div>
  );
};

export default Player;
