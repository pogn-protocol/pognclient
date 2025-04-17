import { useEffect, useState } from "react";

export const useNostrExtensionKey = () => {
  const [nostrPubkey, setNostrPubkey] = useState(null);
  const [nostrAvailable, setNostrAvailable] = useState(false);

  useEffect(() => {
    let tries = 0;
    const maxTries = 20; // 20 * 250ms = 5 seconds

    const interval = setInterval(async () => {
      tries++;
      if (window.nostr) {
        console.log("✅ Nostr extension detected on try", tries);
        clearInterval(interval);
        setNostrAvailable(true);

        try {
          const pubkey = await window.nostr.getPublicKey();
          console.log("🔐 Got pubkey from extension:", pubkey);
          setNostrPubkey(pubkey);
        } catch (e) {
          console.warn("⚠️ Failed to fetch Nostr pubkey:", e);
        }
      } else {
        console.log(`⏳ Waiting for window.nostr... (try ${tries})`);
      }

      if (tries >= maxTries) {
        console.warn("❌ Gave up waiting for Nostr extension.");
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return { nostrAvailable, nostrPubkey };
};
