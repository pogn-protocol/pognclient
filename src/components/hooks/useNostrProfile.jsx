import { useEffect, useState } from "react";
import { SimplePool } from "nostr-tools";

const relays = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.snort.social",
];

export const useNostrProfile = (pubkey) => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!pubkey) return;

    const pool = new SimplePool();
    console.log("🔌 Connecting to relays for Nostr metadata...");

    const sub = pool.sub(relays, [
      {
        kinds: [0],
        authors: [pubkey],
        limit: 1,
      },
    ]);

    sub.on("event", (event) => {
      try {
        const metadata = JSON.parse(event.content);
        console.log("👤 Got Nostr profile metadata:", metadata);
        setProfile(metadata);
      } catch (e) {
        console.warn("❌ Failed to parse Nostr metadata:", e);
      }
    });

    sub.on("eose", () => {
      console.log("📴 Finished metadata fetch.");
      sub.unsub();
    });

    return () => {
      sub.unsub();
    };
  }, [pubkey]);

  return profile;
};
