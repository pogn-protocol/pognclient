import { useState, useEffect } from "react";
import { utils } from "nostr-tools";
import { useNostrExtensionKey } from "./hooks/useNostrExtensionKey";
import "./css/player.css";
import { useLocalState } from "irisdb-hooks";

const defaultKeys = [
  "be7c4cf8b9db6950491f2de3ece4668a1beb93972082d021256146a2b4ae1348",
  "df08f70cb2f084d2fb787af232bbb18873e7d88919854669e4e691ead9baa4f4",
];

const Player = ({ playerId, setPlayerId }) => {
  const { nostrPubkey, nostrDetected, loginNostr, resetNostr } =
    useNostrExtensionKey();

  const [customKeys, setCustomKeys] = useState([]);
  // const [nostrDetected, setNostrDetected] = useState(!!window.nostr);
  const [pendingNostrLogin, setPendingNostrLogin] = useState(false);

  //  const [playerId, setSelectedPlayerId] = useLocalState("pogn/playerId", "");
  // const [selectedPlayerId, setSelectedPlayerId] = useState("");

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (window.nostr) {
  //       setNostrDetected(true);
  //       clearInterval(interval);
  //     }
  //   }, 300);
  //   return () => clearInterval(interval);
  // }, []);

  const allKeys = [
    ...defaultKeys,
    ...(nostrPubkey && !defaultKeys.includes(nostrPubkey) ? [nostrPubkey] : []),
    ...customKeys,
  ];

  // useEffect(() => {
  //   console.log("📌 Effect running — playerId:", playerId);
  //   if (typeof playerId !== "string" || playerId.length < 8) {
  //     console.warn("🚨 Invalid or missing playerId. Resetting...");
  //      setSelectedPlayerId("");
  //     setPlayerId?.("");
  //     return;
  //   }

  // }, [playerId, setPlayerId]);

  const generateNewKey = () => {
    const newKey = utils.generatePrivateKey();
    console.log("⚡ Generated new private key:", newKey);
    setCustomKeys((prev) => [...prev, newKey]);
    //localStorage.setItem("nostrPrivateKey", newKey);
    setPlayerId(newKey);
  };

  const logoutNostrExtension = () => {
    console.log("🚪 Logging out of Nostr extension");
    resetNostr();
    if (playerId === nostrPubkey) {
      setPlayerId(null);
    }

    setTimeout(() => {
      location.reload(); // 💥 hard refresh
    }, 100);
  };

  const handleLoginNostr = async () => {
    //setPendingNostrLogin(true);
    try {
      if (!window.nostr) return;
      const ok = window.confirm(
        `POGN Client: 
        Your NOSTR extension will ask to auth your PUBLIC key to get your NOSTR profile and  irisDB will store your PUBLIC key to your local storage.`
      );
      if (!ok) return;
      // then call signer.user() or signEvent()

      await loginNostr();
    } finally {
      //   setPendingNostrLogin(false);
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
          value={playerId || ""}
          onChange={(e) => {
            const selected = e.target.value;
            console.log("🧩 Selected new key from dropdown:", selected);
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

      {nostrDetected && nostrPubkey && playerId === nostrPubkey && (
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
