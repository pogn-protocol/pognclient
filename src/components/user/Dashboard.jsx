import React from "react";
import { createAvatar } from "@dicebear/avatars";
import * as identiconSprites from "@dicebear/avatars-identicon-sprites";

const Dashboard = ({ activePlayerId, activeProfile }) => {
  console.log("Dashboard activePlayerId", activePlayerId);
  console.log("Dashboard activeProfile", activeProfile);
  // if (!activeProfile) return null;

  const displayName =
    activeProfile?.display_name || activeProfile?.name || "Player";

  const fallbackAvatar = createAvatar(identiconSprites, {
    seed: activePlayerId || "default",
    dataUri: true,
  });

  const profilePic = activeProfile?.picture || fallbackAvatar;

  const follows = activeProfile?.follows || [];
  const followProfiles = activeProfile?.followProfiles || {};

  return (
    <div className="border rounded-xl p-3 shadow-md w-full">
      <h5 className="text-lg font-semibold mb-2">Player Dashboard</h5>

      <div className="flex items-center gap-4 mb-2">
        <div className="w-[5vw] h-[5vw] min-w-[56px] min-h-[56px] rounded-full overflow-hidden border-2 border-blue-500">
          <img src={profilePic} alt="Avatar" className="w-full h-full" />
        </div>
        <div>
          <h3 className="text-base font-bold text-black">{displayName}</h3>
          <p className="text-sm text-black  break-all">ID: {activePlayerId}</p>
        </div>
      </div>

      {follows.length > 0 && (
        <div className="">
          <h6 className="text-sm font-medium text-gray-700 mb-1">
            Following ({follows.length})
          </h6>
          <div className="flex flex-wrap gap-2">
            {follows.slice(0, 24).map((fid) => {
              const profile = followProfiles[fid] || {};
              const pic =
                profile.picture ||
                createAvatar(identiconSprites, {
                  seed: fid,
                  dataUri: true,
                });
              const name =
                profile.display_name || profile.name || fid.slice(0, 8);

              return (
                <div
                  key={fid}
                  className="flex flex-col items-center text-[10px] text-center w-[48px]"
                  title={fid}
                >
                  <img
                    src={pic}
                    alt="pfp"
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                  <span className="truncate w-full mt-1">{name}</span>
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
