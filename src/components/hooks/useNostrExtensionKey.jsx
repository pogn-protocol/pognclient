import { useEffect, useState } from "react";
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

  const logoutNostr = () => {
    console.log("🔄 Resetting Nostr state...");
    setNostrPubkey(null);
    //setNostrDetected(false);
  };

  const loginNostr = async () => {
    if (!window.nostr) {
      console.warn("❌ Nostr extension not available");
      return false;
    }

    try {
      const pubkey = await window.nostr.getPublicKey();
      if (!pubkey) {
        console.warn("❌ No pubkey returned from Nostr extension");
        return false;
      }
      console.log("🔐 Got pubkey from extension:", pubkey);
      setNostrPubkey(pubkey);
      return true;
    } catch (e) {
      console.warn("❌ Failed to fetch pubkey from Nostr extension:", e);
      return false;
    }
  };

  return {
    nostrDetected,
    nostrPubkey,
    loginNostr,
    logoutNostr,
    setNostrPubkey,
  };
};
