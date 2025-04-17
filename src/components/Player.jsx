import { useState, useEffect } from "react";
import { generatePrivateKey } from "nostr-tools";
import { useNostrExtensionKey } from "./hooks/useNostrExtensionKey";
import "./css/player.css";

const defaultKeys = [
  "be7c4cf8b9db6950491f2de3ece4668a1beb93972082d021256146a2b4ae1348",
  "df08f70cb2f084d2fb787af232bbb18873e7d88919854669e4e691ead9baa4f4",
];

const Player = ({ setPlayerId }) => {
  const { nostrPubkey, nostrAvailable, loginNostr, resetNostr } =
    useNostrExtensionKey();

  const [customKeys, setCustomKeys] = useState([]);
  const [nostrDetected, setNostrDetected] = useState(!!window.nostr);
  // const [playerId, setPlayerIdState] = useState(() => {
  //   const stored =
  //     localStorage.getItem("nostrPrivateKey") ||
  //     localStorage.getItem("nostrExtensionKey") ||
  //     null;
  //   console.log("🧠 Initial playerId from storage:", stored);
  //   return stored;
  // });

  const [playerId, setPlayerIdState] = useState(() => {
    const stored = localStorage.getItem("nostrPrivateKey") || null;
    console.log("🧠 Initial playerId from localStorage:", stored);
    return stored;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.nostr) {
        setNostrDetected(true);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const allKeys = [
    ...defaultKeys,
    ...(nostrPubkey && !defaultKeys.includes(nostrPubkey) ? [nostrPubkey] : []),
    ...customKeys,
  ];

  // useEffect(() => {
  //   console.log("📌 Effect running — playerId:", playerId);
  //   if (!playerId && nostrAvailable && nostrPubkey) {
  //     console.log("💡 Auto-setting Nostr extension key as player ID");
  //     setPlayerIdState(nostrPubkey);
  //     setPlayerId?.(nostrPubkey);
  //     return;
  //   }

  //   if (playerId && playerId !== nostrPubkey) {
  //     localStorage.setItem("nostrPrivateKey", playerId);
  //     console.log("📝 Stored custom key to localStorage:", playerId);
  //     setPlayerId?.(playerId);
  //   }

  //   if (playerId === nostrPubkey) {
  //     localStorage.removeItem("nostrPrivateKey");
  //     console.log("🧽 Cleared custom key (using nostrPubkey)");
  //     setPlayerId?.(nostrPubkey);
  //   }
  // }, [playerId, nostrPubkey, nostrAvailable, setPlayerId]);

  useEffect(() => {
    console.log("📌 Effect running — playerId:", playerId);
    if (!playerId && nostrAvailable && nostrPubkey) {
      console.log("💡 Auto-setting Nostr extension key as player ID");
      setPlayerIdState(nostrPubkey);
      setPlayerId?.(nostrPubkey);
      return;
    }

    if (playerId && playerId !== nostrPubkey) {
      localStorage.setItem("nostrPrivateKey", playerId);
      console.log("📝 Stored custom key to localStorage:", playerId);
      setPlayerId?.(playerId);
    }

    if (playerId === nostrPubkey) {
      localStorage.removeItem("nostrPrivateKey");
      console.log("🧽 Cleared custom key (using nostrPubkey)");
      setPlayerId?.(nostrPubkey);
    }
  }, [playerId, nostrPubkey, nostrAvailable, setPlayerId]);

  const generateNewKey = () => {
    const newKey = generatePrivateKey();
    console.log("⚡ Generated new private key:", newKey);
    setCustomKeys((prev) => [...prev, newKey]);
    setPlayerIdState(newKey);
    localStorage.setItem("nostrPrivateKey", newKey);
    setPlayerId?.(newKey);
  };

  const logoutNostrExtension = () => {
    console.log("🚪 Logging out of Nostr extension");
    resetNostr();
    if (playerId === nostrPubkey) {
      setPlayerIdState(null);
      setPlayerId?.(null);
    }

    setTimeout(() => {
      location.reload(); // 💥 hard refresh
    }, 100);
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
          onClick={loginNostr}
        >
          Connect Nostr Extension
        </button>
      )}

      {/* {nostrPubkey && (
        <div className="text-green-600 text-sm italic mb-2">
          ✅ Nostr extension detected: {nostrPubkey.slice(0, 10)}…
        </div>
      )} */}
      <div>
        <label className="form-label">Select or Generate Player ID:</label>
        <select
          className="form-select mb-2"
          value={playerId || ""}
          onChange={(e) => {
            const selected = e.target.value;
            console.log("🧩 Selected new key from dropdown:", selected);
            setPlayerIdState(selected);
            if (selected !== nostrPubkey) {
              localStorage.setItem("nostrPrivateKey", selected);
            } else {
              localStorage.removeItem("nostrPrivateKey");
            }
            setPlayerId?.(selected);
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
          Generate New Key
        </button>
      </div>

      {nostrAvailable && nostrPubkey && playerId === nostrPubkey && (
        <button
          className="btn btn-outline-danger btn-sm mt-2"
          onClick={logoutNostrExtension}
        >
          Log Out Nostr Extension
        </button>
      )}

      <div className="form-text mt-2">
        Selected key is stored in <code>localStorage</code> as your identity.
      </div>
    </div>
  );
};

export default Player;
