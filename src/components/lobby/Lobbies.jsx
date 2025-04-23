import { useEffect, useState } from "react";
import Lobby from "./Lobby";
import MessagesUI from "../messages/MessagesUI";

const Lobbies = ({
  nostrProfileData,
  connections,
  selectedLobbyId,
  setSelectedLobbyId,
  handleSendMessage,
  lobbyMessages,
  setGamesToInit,
  setRemoveRelayConnections,
  setAddRelayConnections,
  playerId,
}) => {
  const [signedInLobbies, setSignedInLobbies] = useState(() => new Set());

  const connectedLobbies = Array.from(connections.entries()).filter(
    ([, conn]) => conn.type === "lobby" && conn.readyState === 1
  );

  return (
    <div className="w-full mt-6">
      <h4 className="text-lg font-semibold text-gray-800 mb-2">
        Select a Lobby
      </h4>

      {/* Lobby Selector */}
      <div className="border border-gray-300 rounded p-3 mb-4 max-h-52 overflow-y-auto">
        {connectedLobbies.map(([id]) => (
          <button
            key={id}
            onClick={() => setSelectedLobbyId(id)}
            className={`w-full text-left px-3 py-2 rounded mb-2 text-sm font-mono ${
              selectedLobbyId === id
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {id}
          </button>
        ))}
      </div>

      {/* Selected Lobby */}
      {selectedLobbyId &&
        (() => {
          const conn = connections.get(selectedLobbyId);

          return (
            <div className="w-full">
              <Lobby
                key={selectedLobbyId}
                lobbyId={selectedLobbyId}
                playerId={playerId}
                sendMessage={(msg) => handleSendMessage(selectedLobbyId, msg)}
                message={lobbyMessages[selectedLobbyId]?.slice(-1)[0] ?? null}
                connectionUrl={conn?.url || ""}
                lobbyConnections={connections}
                setGamesToInit={setGamesToInit}
                setRemoveRelayConnections={setRemoveRelayConnections}
                setAddRelayConnections={setAddRelayConnections}
                nostrProfileData={nostrProfileData}
                LobbyMessagesUI={MessagesUI}
                onSignedIn={(isIn) => {
                  setSignedInLobbies((prev) => {
                    const next = new Set(prev);
                    if (isIn) next.add(selectedLobbyId);
                    else next.delete(selectedLobbyId);
                    return new Set(next);
                  });
                }}
                signedInLobbies={signedInLobbies}
              />
            </div>
          );
        })()}
    </div>
  );
};

export default Lobbies;
