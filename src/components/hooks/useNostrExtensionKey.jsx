import { useEffect } from "react";
import { useLocalState } from "irisdb-hooks";

export const useNostrExtensionKey = () => {
  const [nostrPubkey, setNostrPubkey] = useLocalState("nostr/extensionKey", "");
  const [nostrDetected, setNostrDetected] = useLocalState(
    "nostr/detected",
    false
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.nostr) {
        setNostrDetected(true);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const resetNostr = () => {
    console.log("🔄 Resetting Nostr state...");
    setNostrPubkey(null);
    setNostrDetected(false);
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
    } catch (e) {
      console.warn("❌ Failed to fetch pubkey from Nostr extension:", e);
    }
  };

  return {
    nostrDetected,
    nostrPubkey,
    loginNostr,
    resetNostr,
    setNostrPubkey,
  };
};
