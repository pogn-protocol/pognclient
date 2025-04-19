import { useEffect, useState } from "react";
import { SimplePool } from "nostr-tools/pool";

const pool = new SimplePool();
const relays = [
  "wss://nos.lol",
  "wss://relay.damus.io",
  "wss://relay.snort.social",
];

export const useNostrProfile = (pubkey) => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!pubkey) return;

    console.log("🌍 Fetching Nostr profile for", pubkey);

    const sub = pool.subscribe(
      relays,
      {
        kinds: [0],
        authors: [pubkey],
        limit: 1,
      },
      {
        onevent(event) {
          try {
            const metadata = JSON.parse(event.content);
            console.log("👤 Got metadata:", metadata);
            setProfile(metadata);
          } catch (e) {
            console.warn("❌ Failed to parse profile metadata:", e);
          }
        },
        oneose() {
          console.log("📴 All relays responded (EOSE)");
        },
      }
    );

    return () => {
      console.log("🧹 Unsubscribing from Nostr relays");
      sub.close();
    };
  }, [pubkey]);

  return profile;
};
