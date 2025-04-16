import { useState, useEffect } from "react";
import { generatePrivateKey } from "nostr-tools";

const defaultKeys = [
  "be7c4cf8b9db6950491f2de3ece4668a1beb93972082d021256146a2b4ae1348",
  "df08f70cb2f084d2fb787af232bbb18873e7d88919854669e4e691ead9baa4f4",
];

const Player = ({ setPlayerId }) => {
  const [customKeys, setCustomKeys] = useState([]);
  const allKeys = [...defaultKeys, ...customKeys];

  const [playerId, setPlayerIdState] = useState(() => {
    const stored = sessionStorage.getItem("nostrPrivateKey");
    if (stored) return stored;
    sessionStorage.setItem("nostrPrivateKey", defaultKeys[0]);
    return defaultKeys[0];
  });

  useEffect(() => {
    setPlayerId?.(playerId);
    sessionStorage.setItem("nostrPrivateKey", playerId);
  }, [playerId, setPlayerId]);

  const generateNewKey = () => {
    const newKey = generatePrivateKey();
    setCustomKeys((prev) => [...prev, newKey]);
    setPlayerIdState(newKey);
    sessionStorage.setItem("nostrPrivateKey", newKey);
    setPlayerId?.(newKey);
    console.log("⚡ New key generated:", newKey);
  };

  return (
    <div className="my-3">
      <p className="form-text text-sm text-gray-600 italic">
        Hint: For demo play of auto-generated games open two clients and choose
        one of the provided id's for each player.
      </p>
      <p className="form-text text-sm text-gray-600 italic">
        Sign into the lobby with each of the provided id's and you will be
        pre-joined to the auto generated games.
      </p>
      <p className="form-text text-sm text-gray-600 italic">
        Or generate your own id and create your own games for other players to
        join.
      </p>
      <p className="form-text text-sm text-gray-600 italic">
        Choose a player identity or generate a new private key.
      </p>

      <label className="form-label">Select or Generate Player ID:</label>
      <select
        className="form-select mb-2"
        value={playerId}
        onChange={(e) => {
          const selected = e.target.value;
          setPlayerIdState(selected);
          sessionStorage.setItem("nostrPrivateKey", selected);
          setPlayerId?.(selected);
        }}
        style={{ fontFamily: "monospace", fontSize: "0.9em" }}
      >
        {allKeys.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>

      <button
        className="btn btn-outline-primary btn-sm"
        onClick={generateNewKey}
      >
        Generate New Key
      </button>

      <div className="form-text mt-2">
        Selected key is stored in <code>sessionStorage</code> as your identity.
      </div>
    </div>
  );
};

export default Player;
