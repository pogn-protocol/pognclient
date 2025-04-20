import { useState, useEffect } from "react";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import { useNostrExtensionKey } from "./hooks/useNostrExtensionKey";
import "./css/player.css";

const defaultKeys = [
  "be7c4cf8b9db6950491f2de3ece4668a1beb93972082d021256146a2b4ae1348",
  "df08f70cb2f084d2fb787af232bbb18873e7d88919854669e4e691ead9baa4f4",
];

const Player = ({ activePlayerId, setActivePlayerId, allKeys, setAllKeys }) => {
  const [customKeys, setCustomKeys] = useState([]);
  const { nostrPubkey, nostrDetected, loginNostr, resetNostr } =
    useNostrExtensionKey();

  // ✅ Add key and optionally set it active
  const addKey = (newKey, makeActive = true) => {
    setAllKeys((prev) => {
      if (prev.includes(newKey)) return prev;
      const updated = [...prev, newKey];
      console.log("➕ Added new key:", newKey);
      return updated;
    });

    if (makeActive) {
      console.log("🎯 Promoting new key to active:", newKey);
      setActivePlayerId(newKey);
    }
  };

  // ✅ Inject default and nostr keys once
  useEffect(() => {
    defaultKeys.forEach((k) => addKey(k, false));
  }, []);

  useEffect(() => {
    if (nostrPubkey && nostrDetected) {
      console.log("📡 nostrPubkey updated:", nostrPubkey);
      addKey(nostrPubkey, true); // Add & promote to active
    }
  }, [nostrPubkey, nostrDetected]);

  // ✅ Add custom keys (but don't auto-select them)
  useEffect(() => {
    customKeys.forEach((k) => addKey(k, false));
  }, [customKeys]);

  // ✅ Always ensure activePlayerId is included
  useEffect(() => {
    if (!activePlayerId) return;
    addKey(activePlayerId, false);
  }, [activePlayerId]);

  const generateNewKey = () => {
    let secKey = generateSecretKey();
    const newKey = getPublicKey(secKey);
    console.log("⚡ Generated new private key:", newKey);
    setCustomKeys((prev) => [...prev, newKey]);
    addKey(newKey, true);
  };

  const logoutNostrExtension = () => {
    console.log("🚪 Logging out of Nostr extension");
    resetNostr();
    if (activePlayerId === nostrPubkey) {
      setActivePlayerId(null);
    }

    setTimeout(() => {
      location.reload();
    }, 100);
  };

  const handleLoginNostr = async () => {
    try {
      if (!window.nostr) return;
      const ok = window.confirm(
        `POGN Client:\nYour NOSTR extension will ask to auth your PUBLIC key to get your NOSTR profile and irisDB will store your PUBLIC key to your local storage.`
      );
      if (!ok) return;
      await loginNostr();
    } finally {
      // do nothing
    }
  };

  return (
    <div className="styles.noBootstrap my-3">
      <p className="form-text text-sm text-gray-600 italic">
        Hint: For demo play of auto-generated games open two clients and choose
        one of the provided id's for each player.
      </p>
      <p className="form-text text-sm text-gray-600 italic">
        Choose a player identity or generate a new private key.
      </p>

      {nostrDetected && (
        <div className="text-green-600 text-sm italic mb-2">
          ✅ Nostr extension detected!
        </div>
      )}

      {nostrPubkey && (
        <div className="text-green-600 text-sm italic mb-2">
          ✅ Logged in with Nostr extension: {nostrPubkey.slice(0, 10)}…
        </div>
      )}

      {nostrDetected && !nostrPubkey && (
        <button
          className="btn btn-outline-success btn-sm mt-2"
          onClick={handleLoginNostr}
        >
          Connect Nostr Extension
        </button>
      )}
      <div>
        <label className="form-label">Select or Generate Player ID:</label>
        <select
          className="form-select mb-2"
          value={activePlayerId || ""}
          onChange={(e) => {
            const selected = e.target.value;
            console.log("🧩 Selected new key from dropdown:", selected);
            setActivePlayerId?.(selected);
          }}
          style={{ fontFamily: "monospace", fontSize: "0.9em" }}
        >
          {allKeys.map((key) => (
            <option key={key} value={key}>
              {key}
              {key === nostrPubkey ? " (Nostr Extension)" : ""}
            </option>
          ))}
        </select>

        <button
          className="btn btn-outline-primary btn-sm"
          onClick={generateNewKey}
        >
          Generate New PlayerId
        </button>
      </div>
      {console.log(
        "activePlayerId",
        activePlayerId,
        "nostrPubkey",
        nostrPubkey,
        "nostrDetected",
        nostrDetected
      )}
      {nostrDetected && nostrPubkey && activePlayerId === nostrPubkey && (
        <button
          className="btn btn-outline-danger btn-sm mt-2"
          onClick={logoutNostrExtension}
        >
          Log Out Nostr Extension
        </button>
      )}

      <div className="form-text mt-2">
        Selected key is stored in <code>IrisDB: localStorage</code> as your
        identity.
      </div>
    </div>
  );
};

export default Player;
