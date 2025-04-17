import { useState, useEffect } from "react";

export const useNostrExtensionKey = () => {
  const [nostrPubkey, setNostrPubkey] = useState(
    () => localStorage.getItem("nostrExtensionKey") || null
  );
  const [nostrAvailable, setNostrAvailable] = useState(!!window.nostr);
  const [nostrDetected, setNostrDetected] = useState(!!window.nostr);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.nostr) {
        setNostrDetected(true);
        setNostrAvailable(true);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const resetNostr = () => {
    console.log("🔄 Resetting Nostr state...");
    localStorage.removeItem("nostrExtensionKey");
    setNostrPubkey(null);
    setNostrAvailable(false);
  };

  const loginNostr = async () => {
    if (!window.nostr) {
      console.warn("❌ Nostr extension not available");
      return;
    }

    try {
      const pubkey = await window.nostr.getPublicKey();
      console.log("🔐 Got pubkey from extension:", pubkey);
      setNostrPubkey(pubkey);
      localStorage.setItem("nostrExtensionKey", pubkey);
      setNostrAvailable(true);
    } catch (e) {
      console.warn("❌ Failed to fetch pubkey from Nostr extension:", e);
    }
  };

  return {
    nostrDetected,
    nostrAvailable,
    nostrPubkey,
    loginNostr,
    resetNostr,
  };
};
