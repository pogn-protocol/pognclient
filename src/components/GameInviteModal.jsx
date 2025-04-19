import { useEffect, useState } from "react";
import { useNostrExtensionKey } from "./hooks/useNostrExtensionKey";
import "bootstrap/dist/css/bootstrap.min.css";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
const GameInviteModal = ({
  isOpen,
  onClose,
  urlParams,
  setPlayerId,
  sendMessage,
  lastGameInviteMessage,
  connections,
}) => {
  const { nostrDetected, nostrPubkey, setNostrPubkey } = useNostrExtensionKey();

  const [customId, setCustomId] = useState("");
  const [pendingJoin, setPendingJoin] = useState(false);
  const [nostrLogin, setNostrLogin] = useState(false);
  const [pubkey, setPubkey] = useState(nostrPubkey); // Store the public key in state
  const [sentGameInvite, setSentGameInvite] = useState(false);
  const [verifiedGameDetails, setVerifiedGameDetails] = useState(null);

  useEffect(() => {
    if (sentGameInvite) return;
    if (!urlParams) return;
    if (!connections.get("lobby1")) {
      console.log("GameInviteModal lobby1 not ready", connections);
      return;
    }
    console.log("GameInviteModal urlParams:", urlParams);

    let lobbyId = urlParams.lobbyId || "lobby1";
    let id = lobbyId;
    if (connections.has(lobbyId)) {
      console.log("GameInviteModal lobbyId connected:", lobbyId);

      sendMessage(id, {
        payload: {
          type: "lobby",
          action: "gameInvite",
          playerId: urlParams.playerId,
          gameId: urlParams.gameId,
          lobbyId: lobbyId,
          urlParams,
        },
      });
      setSentGameInvite(true);
    } else {
      console.log("GameInviteModal lobbyId not connected:", lobbyId);
    }
  }, [urlParams, connections, sentGameInvite, sendMessage]);

  useEffect(() => {
    //return if empty object
    if (
      !lastGameInviteMessage ||
      Object.keys(lastGameInviteMessage).length === 0
    )
      return;
    if (verifiedGameDetails) return;
    console.log(
      "GameInviteModal lastGameInviteMessage:",
      lastGameInviteMessage
    );

    const { payload } = lastGameInviteMessage;
    const { type, action, gameId, playerId } = payload;
    //check if lastGameInviteMessage gameId is the same as gameInviteId
    if (action === "gameInviteError") {
      console.log("❌ Game invite error: ", lastGameInviteMessage);
      return;
    }
    if (action === "inviteVerified") {
      console.log("✅ Game inviteVerified: " + lastGameInviteMessage);
      setVerifiedGameDetails({
        ...lastGameInviteMessage,
      });

      return;
    }
    if (action === "refreshLobby") {
      //   alert("✅ Refresh the damn lobby!");
      //   return;
      onClose();
    }
  }, [lastGameInviteMessage, verifiedGameDetails]);

  const handleJoinPrivateGame = async () => {
    if (!window.nostr) return;

    setPendingJoin(true);
    try {
      const pubkey = await window.nostr.getPublicKey(); // ✅ get pubkey directly
      if (pubkey === urlParams.playerId) {
        console.log("✅ Authenticated with Nostr extension:", pubkey);
        alert(" ✅ Joining private game!");
        setPlayerId(pubkey);
        setNostrPubkey(pubkey); // Store the pubkey in local state
        setNostrLogin(true);
        setPubkey(pubkey);
        console.log("urlParams", urlParams);
        sendMessage("lobby1", {
          payload: {
            type: "lobby",
            lobbyId: "lobby1",
            action: "joinGame",
            playerId: pubkey,
            gameId: urlParams.gameId,
          },
        });
      } else {
        alert(
          " ❌ Your nostr id doesn't match the invitation playerId. Can't join private game!"
        );
        return;
      }
    } catch (e) {
      console.warn("Auth private game join failed:", e);
      alert("❌ Auth private game join failed.");
    } finally {
      //onClose(); // ✅ Close modal on success
      //(false);
    }
  };

  //   const handleJoinWithCustomId = () => {
  //     if (!customId.trim()) return;
  //     setPlayerId(customId.trim());
  //     onClose();
  //   };

  if (!isOpen) return null;

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">🎮Join private POGN Game </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <p>Poker and Other Games on Nostr: fast, fun, and decentralized.</p>
            <p>
              PlayerId: <strong>{urlParams.playerId}</strong>
            </p>

            {verifiedGameDetails ? (
              <div>
                <p>
                  Invited to join game: <strong>{urlParams.gameId}</strong>
                </p>
                <div className="text-center break-words mb-2">
                  <JsonView
                    data={verifiedGameDetails}
                    shouldExpandNode={(level, value, type) =>
                      level === 0 || type === "payload"
                    }
                    style={{ fontSize: "14px", lineHeight: "1.2" }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-danger text-sm mb-2">
                ❌ GameInvite not verified by server.
              </p>
            )}

            {nostrDetected && (
              <div className="mx-3">
                <div className="text-success text-sm mb-2">
                  ✅ Nostr extension detected!
                </div>

                <div className="text-danger text-sm mb-2">
                  Your nostr extension will ask you to authorize your PUBLIC key
                  in order to join the private game.
                </div>
              </div>
            )}

            {nostrDetected ? (
              !nostrLogin ? (
                <button
                  onClick={handleJoinPrivateGame}
                  className="btn btn-primary w-100 mb-2"
                  disabled={pendingJoin}
                >
                  {pendingJoin
                    ? "Waiting for Nostr..."
                    : "Click to join private POGN game"}
                </button>
              ) : (
                <div className="text-success text-sm mb-2 text-center fw-semibold">
                  ✅ Authenticated as: {pubkey.slice(0, 12)}...
                </div>
              )
            ) : (
              <div className="text-danger fst-italic mb-2">
                No Nostr extension detected.
              </div>
            )}

            <button className="btn btn-secondary w-100" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInviteModal;
