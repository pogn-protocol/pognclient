import { useEffect } from "react";
import { SimplePool } from "nostr-tools/pool";

const relays = [
  "wss://relay.damus.io",
  "wss://relay.snort.social",
  "wss://nos.lol",
  "wss://relay.nostr.band",
];
const pool = new SimplePool();

export function useNostrProfiles(playersAtTable, setPlayersAtTable) {
  useEffect(() => {
    const fetchNostrProfile = async (pubkey) => {
      return new Promise((resolve) => {
        const sub = pool.subscribe(
          relays,
          { kinds: [0], authors: [pubkey], limit: 1 },
          {
            onevent(event) {
              try {
                const metadata = JSON.parse(event.content);
                resolve(metadata);
              } catch (e) {
                resolve(null);
              } finally {
                sub.close();
              }
            },
            oneose() {
              resolve(null);
              sub.close();
            },
          }
        );
      });
    };

    const resolveUnknownProfiles = async () => {
      if (!Array.isArray(playersAtTable) || playersAtTable.length === 0) return;

      const unresolved = playersAtTable.filter((p) => {
        if (!p || typeof p !== "object") return false;
        const { playerId, name, display_name, picture } = p;
        const isValidId =
          typeof playerId === "string" && /^[a-f0-9]{64}$/i.test(playerId);
        const hasProfile = name || display_name || picture;
        return isValidId && !hasProfile;
      });

      const updates = await Promise.all(
        unresolved.map(async (p) => {
          const profile = await fetchNostrProfile(p.playerId);
          return profile ? { playerId: p.playerId, profile } : null;
        })
      );

      const validUpdates = updates.filter(Boolean);

      if (validUpdates.length > 0) {
        setPlayersAtTable((prev) =>
          prev.map((entry) => {
            const match = validUpdates.find(
              (u) => u.playerId === entry?.playerId
            );
            return match ? { ...entry, ...match.profile } : entry;
          })
        );
      }
    };

    resolveUnknownProfiles();
  }, [playersAtTable, setPlayersAtTable]);
}
