import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Description,
} from "@headlessui/react";
import { useEffect } from "react";
import pognLogo from "../../assets/pogn.png";

const NoteGameResults = ({
  isOpen,
  playerId,
  nostrProfile = {},
  gameSummary = "",
  sendMessage,
  message,
  onClose,
}) => {
  console.log("nostrProfile", nostrProfile);
  const profile = nostrProfile ?? {};
  const profilePic = profile.picture;
  const displayName =
    profile.display_name || profile.name || playerId?.slice(0, 12);

  const handleConfirm = () => {
    const notePayload = {
      type: "lobby",
      action: "postGameResult",
      playerId,
      lobbyId: "lobby1",
      params: {
        gameSummary,
        profile: {
          name: displayName,
          picture: profilePic,
        },
      },
    };

    console.log("📤 Sending note payload:", notePayload);
    sendMessage("lobby1", { payload: notePayload }); // or "notehub" etc

    //setIsOpen(false);
  };
  useEffect(() => {
    if (!message?.payload) return;
    console.log(`📩 NoteGameResults received message`, message);

    const { payload } = message;
    if (payload?.action === "postGameResultConfirmed") {
      if (payload.status === "success") {
        alert(`✅${payload.message}`);
      } else {
        alert("❌ Failed to post game result note.");
      }
      onClose();
    }
  }, [message]);

  return (
    <Dialog open={isOpen} onClose={() => onClose()} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-3xl space-y-4 border bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex justify-center mt-3">
            <img
              src={pognLogo}
              alt="POGN Logo"
              className="w-20 h-20 rounded-full object-cover bg-black"
            />
          </div>

          <DialogTitle className="text-lg font-bold text-center mt-2">
            Post game results to POGN Gamehub on NOSTR?
          </DialogTitle>

          <Description className="text-sm text-gray-600 text-center m-3">
            POGN Server will publish the game results to the POGN Gamehub
            account on NOSTR.
          </Description>

          <div className="flex flex-col justify-center items-center min-h-80 w-full">
            <div className="bg-gray-100 rounded p-4 min-h-80 w-full max-w-2xl mx-auto flex flex-col items-center">
              <img
                src={profilePic || "/fallback-avatar.png"}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border"
              />
              <div className="text-sm font-semibold mt-2">{displayName}</div>
              <div className="text-xs text-gray-600 break-words text-center max-w-sm mb-2">
                {playerId}
              </div>
              <p className="w-full mt-3 text-left font-mono text-sm whitespace-pre-wrap break-words break-all">
                {gameSummary}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 m-4">
            <button
              onClick={() => onClose()}
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Post Note
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default NoteGameResults;
