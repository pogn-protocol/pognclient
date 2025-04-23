import React from "react";
import { createAvatar } from "@dicebear/avatars";
import * as identiconSprites from "@dicebear/avatars-identicon-sprites";
//import "./css/dashboard.css";
import { useNostrExtensionKey } from "../hooks/useNostrExtensionKey";

const Dashboard = ({
  playerName,
  playerId,
  nostrProfile,
  follows,
  followProfiles = {},
}) => {
  const { nostrPubkey } = useNostrExtensionKey();

  const isNostrUser = nostrPubkey && playerId === nostrPubkey;

  const avatarSvg = createAvatar(identiconSprites, {
    seed: playerId || "default",
    dataUri: true,
  });

  const displayName =
    isNostrUser && nostrProfile
      ? nostrProfile.display_name || nostrProfile.name || playerName
      : playerName || "Anonymous";

  const profilePic = isNostrUser && nostrProfile?.picture;

  return (
    <div className="w-[100%] mx-auto border border-black rounded-xl p-4 shadow-md box-border">
      <h5 className="text-lg font-semibold mb-4">Player Dashboard</h5>

      <div className="flex flex-row items-center gap-4 mb-4">
        <div className="w-[5vw] h-[5vw] min-w-[56px] min-h-[56px] rounded-full overflow-hidden border-2 border-blue-500 shrink-0">
          <img
            src={profilePic || avatarSvg}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="text-xl font-bold text-black break-words">
            {displayName}
          </h3>
          <p className="text-sm text-black break-words mt-1">ID: {playerId}</p>
        </div>
      </div>

      {isNostrUser && follows?.length > 0 && (
        <div>
          <h6 className="font-medium text-sm mb-2">Following:</h6>
          <div className="flex flex-wrap gap-3">
            {follows.slice(0, 6).map((followId) => {
              const profile = followProfiles[followId] || {};
              const name =
                profile.display_name || profile.name || followId.slice(0, 8);
              const avatar =
                profile.picture ||
                createAvatar(identiconSprites, {
                  seed: followId,
                  dataUri: true,
                });

              return (
                <div
                  key={followId}
                  className="flex flex-col items-center text-center w-[48px]"
                >
                  <img
                    src={avatar}
                    alt={name}
                    title={followId}
                    className="w-10 h-10 rounded-full object-cover mb-1"
                  />
                  <div className="text-[0.65rem] leading-tight break-words">
                    {name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
