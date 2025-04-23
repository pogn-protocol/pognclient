import { useEffect, useState, useMemo } from "react";
import { useLocalState, useAuthors } from "irisdb-hooks";
import { SimplePool } from "nostr-tools/pool";

const relays = [
  "wss://relay.damus.io",
  "wss://relay.snort.social",
  "wss://nos.lol",
  "wss://strfry.iris.to",
  "wss://relay.nostr.band",
];

const pool = new SimplePool();

const useNostr = () => {
  const [irisPubkey] = useLocalState("nostr/extensionKey", "");
  const [profile, setProfile] = useState(null);
  const [manualFollows, setManualFollows] = useState([]);
  const [followProfiles, setFollowProfiles] = useState({});

  const follows = useAuthors("follows");

  const allFollows = useMemo(() => {
    const combined = [...follows, ...manualFollows];
    return Array.from(
      new Set(
        combined.filter(
          (pk) =>
            typeof pk === "string" && pk.length === 64 && pk !== irisPubkey
        )
      )
    );
  }, [follows, manualFollows, irisPubkey]);

  // 👤 Load own profile (kind 0)
  useEffect(() => {
    if (!irisPubkey) {
      setProfile(null); // 🧼 clear nostrProfile on logout
      setManualFollows([]); // 🧼 clear follows too
      setFollowProfiles({});
      return;
    }
    const sub = pool.subscribe(
      relays,
      {
        kinds: [0],
        authors: [irisPubkey],
        limit: 1,
      },
      {
        onevent(event) {
          try {
            const metadata = JSON.parse(event.content);
            setProfile(metadata);
            console.log("✅ Own profile:", metadata);
          } catch (err) {
            console.warn("❌ Profile parse error:", err);
          }
        },
      }
    );
    return () => sub.close();
  }, [irisPubkey]);

  // 👥 Manual follows (kind 3)
  useEffect(() => {
    if (!irisPubkey) return;
    const sub = pool.subscribe(
      relays,
      {
        kinds: [3],
        authors: [irisPubkey],
        limit: 1,
      },
      {
        onevent(event) {
          const pubkeys = (event.tags || [])
            .filter(([t]) => t === "p")
            .map(([, pk]) => pk)
            .filter((pk) => typeof pk === "string" && pk.length === 64);
          setManualFollows(pubkeys);
          console.log("📦 Manual follows:", pubkeys);
        },
      }
    );
    return () => sub.close();
  }, [irisPubkey]);

  // 📇 Fetch profiles of all follows (kind 0)
  useEffect(() => {
    if (!allFollows.length) return;

    const sub = pool.subscribe(
      relays,
      {
        kinds: [0],
        authors: allFollows,
        limit: allFollows.length,
      },
      {
        onevent(event) {
          try {
            const metadata = JSON.parse(event.content);
            setFollowProfiles((prev) => ({
              ...prev,
              [event.pubkey]: metadata,
            }));
          } catch (e) {
            console.warn("❌ Failed to parse follow profile:", e);
          }
        },
      }
    );

    return () => sub.close();
  }, [allFollows.join()]); // use join() to trigger effect on key changes

  return { nostrProfile: profile, follows: allFollows, followProfiles };
};

export default useNostr;
