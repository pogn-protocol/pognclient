import React from "react";
import { createAvatar } from "@dicebear/avatars";
import * as identiconSprites from "@dicebear/avatars-identicon-sprites";
import "./css/dashboard.css";
import { useNostrExtensionKey } from "./hooks/useNostrExtensionKey";
import { useNostrProfile } from "./hooks/useNostrProfile";

const Dashboard = ({ playerName, playerId }) => {
  const { nostrPubkey } = useNostrExtensionKey();
  const nostrProfile = useNostrProfile(nostrPubkey);

  // Generate Dicebear avatar as fallback
  const avatarSvg = createAvatar(identiconSprites, {
    seed: playerId,
    dataUri: true,
  });

  const isNostrUser = nostrPubkey && nostrPubkey === playerId;

  const displayName = isNostrUser
    ? nostrProfile?.display_name || nostrProfile?.name || playerName
    : playerName;

  const profilePic = isNostrUser ? nostrProfile?.picture : null;

  return (
    <div className="player-dashboard mt-2">
      <h5>Player Dashboard</h5>
      <div className="d-flex flex-row player-info">
        <div className="avatar">
          {profilePic ? (
            <img src={profilePic} alt="Nostr Avatar" />
          ) : (
            <img src={avatarSvg} alt="Fallback Avatar" />
          )}
        </div>
        <div className="details">
          <h3>{displayName}</h3>
          <p>ID: {playerId}</p>
        </div>
      </div>
    </div>
  );
};

// const Dashboard = ({ playerName, playerId }) => {
//   // Generate a unique avatar using player ID
//   const avatarSvg = createAvatar(identiconSprites, {
//     seed: playerId, // Use playerId to generate unique avatar
//     dataUri: true, // Return as a data URI for easy use in <img>
//   });

//   return (
//     <div className="player-dashboard mt-2">
//       <h5>Player Dashboard</h5>
//       <div className="d-flex flex-row player-info">
//         <div className="avatar">
//           <img src={avatarSvg} alt="Player Avatar" />
//         </div>
//         <div className="details">
//           <h3>{playerName}</h3>
//           <p>ID: {playerId}</p>
//         </div>
//       </div>
//     </div>
//   );
// };

export default Dashboard;
