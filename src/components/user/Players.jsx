import React, { useEffect, useState, useRef } from "react";
import Dashboard from "./Dashboard";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import { useNostrExtensionKey } from "../hooks/useNostrExtensionKey";
import useNostr from "../hooks/useNostr";

const defaultKeys = [
  "be7c4cf8b9db6950491f2de3ece4668a1beb93972082d021256146a2b4ae1348",
  "df08f70cb2f084d2fb787af232bbb18873e7d88919854669e4e691ead9baa4f4",
];

const Players = ({
  setActivePlayerId,
  setNostrProfileData,
  nostrProfileData,
  activePlayerId,
  setPlayers,
  players,
}) => {
  // const [players, setPlayers] = useState([]);
  const { nostrPubkey, nostrDetected, loginNostr, logoutNostr } =
    useNostrExtensionKey();
  const { nostrProfile, follows, followProfiles } = useNostr();

  useEffect(() => {
    if (activePlayerId) {
      sessionStorage.setItem("activePlayerId", activePlayerId);
    }
  }, [activePlayerId]);

  // Bootstrap default demo keys
  useEffect(() => {
    defaultKeys.forEach((pk) => {
      setPlayers((prev) =>
        prev.some((p) => p.id === pk)
          ? prev
          : [...prev, { id: pk, pubkeySource: "default" }]
      );
    });
  }, []);

  // Add nostr key on detection
  useEffect(() => {
    if (!nostrDetected || !nostrPubkey) return;
    setPlayers((prev) =>
      prev.some((p) => p.id === nostrPubkey)
        ? prev
        : [...prev, { id: nostrPubkey, pubkeySource: "nostr" }]
    );
  }, [nostrDetected, nostrPubkey]);

  useEffect(() => {
    const isActiveNostrPlayer =
      activePlayerId && nostrPubkey && activePlayerId === nostrPubkey;
    const hasProfile = nostrProfile && Object.keys(nostrProfile).length > 0;
    const hasFollows = Array.isArray(follows) && follows.length > 0;
    const hasFollowProfiles =
      followProfiles && Object.keys(followProfiles).length > 0;

    console.log("🔍 [useEffect] CHECKING NOSTR PROFILE ASSIGNMENT...");
    console.log("👉 activePlayerId:", activePlayerId);
    console.log("👉 nostrPubkey:", nostrPubkey);
    console.log(
      "🧪 MATCH (activePlayerId === nostrPubkey):",
      activePlayerId === nostrPubkey
    );
    console.log("🧾 nostrProfile:", nostrProfile);
    console.log("👥 follows:", follows);
    console.log("📇 followProfiles:", followProfiles);

    if (!isActiveNostrPlayer || !hasProfile) {
      console.warn("❌ Conditions not met — clearing nostrProfileData.");
      setNostrProfileData?.(null);
      return;
    }

    const profilePayload = {
      id: nostrPubkey,
      ...nostrProfile,
      follows: hasFollows ? follows : [],
      followProfiles: hasFollowProfiles ? followProfiles : {},
    };

    console.log("✅ ALL CONDITIONS MET — SETTING nostrProfileData:");
    console.log(profilePayload);

    setNostrProfileData(profilePayload);
  }, [
    activePlayerId,
    nostrPubkey,
    nostrProfile?.display_name,
    follows?.length,
    Object.keys(followProfiles || {}).length,
  ]);

  const handleGenerateNewKey = () => {
    const sk = generateSecretKey();
    const pk = getPublicKey(sk);
    setPlayers((prev) =>
      prev.some((p) => p.id === pk)
        ? prev
        : [...prev, { id: pk, pubkeySource: "generated" }]
    );
    setActivePlayerId(pk);
  };

  useEffect(() => {
    const storedId = sessionStorage.getItem("activePlayerId");

    if (!activePlayerId && storedId && players.some((p) => p.id === storedId)) {
      setActivePlayerId(storedId);
    }
  }, [players, activePlayerId]);

  useEffect(() => {
    if (!nostrPubkey) return;

    setPlayers((prev) => {
      const alreadyExists = prev.some((p) => p.id === nostrPubkey);
      return alreadyExists
        ? prev
        : [...prev, { id: nostrPubkey, pubkeySource: "nostr" }];
    });
  }, [nostrPubkey]);

  const handleNostrLogout = () => {
    logoutNostr();
    setPlayers((prev) => prev.filter((p) => p.pubkeySource !== "nostr"));
    setNostrProfileData?.(null);
    setActivePlayerId(null); // 🧼 also clears IrisDB entry
  };

  return (
    <div className="w-full my-2 space-y-4 text-sm text-gray-700">
      {nostrDetected && (
        <div className="text-green-600 italic">
          ✅ Nostr extension detected!
        </div>
      )}
      {nostrPubkey && (
        <div className="text-green-600 italic">
          ✅ Logged in with Nostr extension: {nostrPubkey.slice(0, 10)}…
        </div>
      )}

      <label className="block text-sm font-medium text-gray-700">
        Select or Generate Player ID:
      </label>

      <select
        className="w-full p-2 border rounded text-sm font-mono"
        value={activePlayerId || ""}
        onChange={(e) => setActivePlayerId(e.target.value)}
      >
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.pubkeySource === "nostr" ? " (Nostr Ext. Key) " : ""}
            {p.id}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-2 mt-2">
        <button
          className="px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition"
          onClick={handleGenerateNewKey}
        >
          Generate New Player ID
        </button>

        {nostrDetected && !nostrPubkey && (
          <button
            className="px-3 py-1 text-sm border border-green-500 text-green-500 rounded hover:bg-green-500 hover:text-white transition"
            onClick={loginNostr}
          >
            Connect Nostr Extension
          </button>
        )}

        {nostrDetected && nostrPubkey && activePlayerId === nostrPubkey && (
          <button
            className="px-3 py-1 text-sm border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition"
            onClick={handleNostrLogout}
          >
            Log Out Nostr Extension
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        {/* Selected key is stored in{" "}
        <code className="bg-gray-100 px-1 py-0.5 rounded">IrisDB</code> as your
        identity. */}
      </p>

      <div className="mt-4">
        {activePlayerId && (
          <Dashboard
            activePlayerId={activePlayerId}
            activeProfile={
              activePlayerId === nostrPubkey ? nostrProfileData : undefined
            }
          />
        )}
      </div>
    </div>
  );
};

export default Players;
