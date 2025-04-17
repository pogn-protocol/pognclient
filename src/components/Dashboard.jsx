import React from "react";
import { createAvatar } from "@dicebear/avatars";
import * as identiconSprites from "@dicebear/avatars-identicon-sprites";
import "./css/dashboard.css";
import { useNostrProfile } from "./hooks/useNostrProfile";
import { useNostrExtensionKey } from "./hooks/useNostrExtensionKey";

const Dashboard = ({ playerName, playerId }) => {
  const { nostrPubkey } = useNostrExtensionKey();
  console.log("📥 Dashboard: Received props →", { playerName, playerId });

  const isNostrUser = nostrPubkey && playerId === nostrPubkey;
  console.log("🔍 nostrPubkey:", nostrPubkey);
  console.log("🧠 isNostrUser:", isNostrUser);

  const nostrProfile = useNostrProfile(isNostrUser ? playerId : null);
  console.log("👤 nostrProfile returned:", nostrProfile);

  const avatarSvg = createAvatar(identiconSprites, {
    seed: playerId || "default",
    dataUri: true,
  });
  console.log("🎨 Dicebear fallback avatar generated.");

  const displayName =
    isNostrUser && nostrProfile
      ? nostrProfile.display_name || nostrProfile.name || playerName
      : playerName || "Anonymous";

  console.log("🏷️ displayName resolved:", displayName);

  const profilePic = isNostrUser && nostrProfile?.picture;
  console.log(
    "🖼️ Final profile picture source:",
    profilePic || "(dicebear fallback)"
  );

  return (
    <div className="player-dashboard mt-2">
      <h5>Player Dashboard</h5>
      <div className="d-flex flex-row player-info">
        <div className="avatar">
          <img
            src={profilePic || avatarSvg}
            alt={profilePic ? "Nostr Avatar" : "Fallback Avatar"}
          />
        </div>
        <div className="details">
          <h3>{displayName}</h3>
          <p>ID: {playerId}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
