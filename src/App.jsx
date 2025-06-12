import React, { useState, useEffect, useRef } from "react";
import ErrorBoundary from "./ErrorBoundary";
import GameConsole from "./components/gameConsole/GameConsole";
import useMessages from "./components/hooks/useMessages";
import RelayManager from "./components/connections/RelayManager";
import pognClientConfigs from "./pognClientConfigs";
import ConnectionsUI from "./components/connections/ConnectionsUI";
import Lobbies from "./components/lobby/Lobbies";
import MessagesUI from "./components/messages/MessagesUI";
import Players from "./components/user/Players";
import GameInviteModal from "./components/user/GameInviteModal";
import { useNostrExtensionKey } from "./components/hooks/useNostrExtensionKey";
import DemoGame from "./components/demoGame/DemoGame";
console.log("pognClientConfigs", pognClientConfigs);

window.onerror = function (message, source, lineno, colno, error) {
  console.error(
    "🚨 Global Error Caught:",
    message,
    "at",
    source,
    ":",
    lineno,
    ":",
    colno,
    error
  );
};

window.addEventListener("unhandledrejection", function (event) {
  console.error("🚨 Unhandled Promise Rejection:", event.reason);
});

const App = () => {
  const [activePlayerId, setActivePlayerId] = useState(null);
  const [gamesToInit, setGamesToInit] = useState(new Map());
  const [sendMessageToUrl, setSendMessageToUrl] = useState(() => () => {});
  const [addRelayConnections, setAddRelayConnections] = useState([]);
  const [removeRelayConnections, setRemoveRelayConnections] = useState([]);
  const [selectedLobbyId, setSelectedLobbyId] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [selectedRelayId, setSelectedRelayId] = useState(null);
  const [connections, setConnections] = useState(new Map());
  const [nostrProfileData, setNostrProfileData] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteParams, setInviteParams] = useState({});
  const [showInviteModal, setShowInviteModal] = useState(false);
  const hasInviteUrlBeenProcessed = useRef(false);
  const hasInviteModalBeenShown = useRef(false);
  const [players, setPlayers] = useState([]);
  const [inviteProcessed, setInviteProcessed] = useState(false);

  const {
    messages,
    sentMessages,
    lobbyMessages,
    gameMessages,
    handleMessage,
    handleSendMessage,
  } = useMessages(
    activePlayerId,
    connections,
    sendMessageToUrl,
    setAddRelayConnections,
    setRemoveRelayConnections
  );

  const { nostrPubkey } = useNostrExtensionKey();

  const isNostrActivePlayer = nostrPubkey && activePlayerId === nostrPubkey;

  // Handle invite URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsed = Object.fromEntries(params.entries());

    if (parsed.invite === "true" && !hasInviteUrlBeenProcessed.current) {
      hasInviteUrlBeenProcessed.current = true;
      setInviteProcessed(true);
      setInviteParams(parsed);
      setPlayers((prev) =>
        prev.some((p) => p.id === parsed.playerId)
          ? prev
          : [...prev, { id: parsed.playerId, pubkeySource: "url" }]
      );
      setActivePlayerId(parsed.playerId);
    }
  }, []);

  // Trigger invite modal after connection
  useEffect(() => {
    console.log(
      "inviteProcessed",
      inviteProcessed,
      "connections",
      connections,
      "isNostrActivePlayer",
      isNostrActivePlayer,
      "hasInviteModalBeenShown",
      hasInviteModalBeenShown.current,
      "hasInviteUrlBeenProcessed",
      hasInviteUrlBeenProcessed.current
    );

    if (
      hasInviteUrlBeenProcessed.current &&
      !hasInviteModalBeenShown.current &&
      connections.get("lobby1")?.readyState === 1
    ) {
      hasInviteModalBeenShown.current = true;
      setShowInviteModal(true);
      setInviteOpen(true);
    }
  }, [inviteProcessed, connections, isNostrActivePlayer]);

  const closeInvite = () => {
    setInviteOpen(false);
    setInviteParams(null);
    setShowInviteModal(false);
  };

  useEffect(() => {
    setAddRelayConnections((prev) => {
      const alreadyAdded = new Set(prev.map((c) => c.id));
      const initConnections = pognClientConfigs.BOOTSTRAP_CONNECTIONS.filter(
        (conn) => !alreadyAdded.has(conn.id)
      );
      return [...prev, ...initConnections];
    });
  }, []);

  useEffect(() => {
    if (!selectedLobbyId) {
      const firstLobbyId = Array.from(connections.entries()).filter(
        ([_, conn]) => conn.type === "lobby"
      )[0]?.[0];
      if (firstLobbyId) {
        setSelectedLobbyId(firstLobbyId);
      }
    }
  }, [connections, selectedLobbyId]);

  const connectedLobbies = Array.from(connections.entries()).filter(
    ([_, conn]) => conn.type === "lobby" && conn.readyState === 1
  );

  useEffect(() => {
    if (!selectedConnectionId && connectedLobbies.length > 0) {
      setSelectedConnectionId(connectedLobbies[0][0]);
    }
  }, [connectedLobbies, selectedConnectionId]);

  useEffect(() => {
    console.log("activePlayerId", activePlayerId);
  }, [activePlayerId]);

  console.log("showInviteModal", showInviteModal);

  return (
    <ErrorBoundary>
      <div className="w-full max-w-[800px] flex flex-col justify-center items-center mx-auto p-4">
        {showInviteModal && (
          <GameInviteModal
            isOpen={inviteOpen}
            onClose={closeInvite}
            urlParams={inviteParams}
            setActivePlayerId={setActivePlayerId}
            sendMessage={handleSendMessage}
            connections={connections}
            setShowInviteModal={setInviteOpen}
            activePlayerId={activePlayerId}
            lastGameInviteMessage={
              Object.values(messages).flat().at(-1) || null
            }
            setPlayers={setPlayers}
          />
        )}
        <header className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">POGN Client</h1>
          <h2 className="text-md text-gray-600">
            Poker and Other Game On NOSTR
          </h2>
        </header>

        <div className="w-full max-w-screen-xl flex flex-col gap-2">
          <Players
            setActivePlayerId={setActivePlayerId}
            sendMessage={handleSendMessage}
            activePlayerId={activePlayerId}
            setNostrProfileData={setNostrProfileData}
            nostrProfileData={nostrProfileData}
            players={players}
            setPlayers={setPlayers}
          />
          {activePlayerId && (
            <DemoGame
              activePlayerId={activePlayerId}
              setActivePlayerId={setActivePlayerId}
              setPlayers={setPlayers}
              players={players}
              nostrProfileData={nostrProfileData}
              sendMessage={handleSendMessage}
              setAddRelayConnections={setAddRelayConnections}
              messages={Object.values(messages).flat() || []}
            />
          )}

          <RelayManager
            addRelayConnections={addRelayConnections}
            setAddRelayConnections={setAddRelayConnections}
            removeRelayConnections={removeRelayConnections}
            setRemoveRelayConnections={setRemoveRelayConnections}
            onMessage={handleMessage}
            setSendMessage={setSendMessageToUrl}
            connections={connections}
            setConnections={setConnections}
            selectedRelayId={selectedRelayId}
            setSelectedRelayId={setSelectedRelayId}
          />

          <ConnectionsUI
            connections={connections}
            setAddRelayConnections={setAddRelayConnections}
            selectedConnectionId={selectedConnectionId}
            setSelectedConnectionId={setSelectedConnectionId}
            sendMessage={(id, msg) => handleSendMessage(id, msg)}
            messages={messages}
            playerId={activePlayerId}
          />
          <div className="">
            <p className="italic text-gray-600">
              Hint: For demo play of auto-generated games, open two clients and
              choose one of the provided IDs for each player.
            </p>
          </div>
          <Lobbies
            playerId={activePlayerId}
            nostrProfileData={nostrProfileData}
            connections={connections}
            selectedLobbyId={selectedLobbyId}
            setSelectedLobbyId={setSelectedLobbyId}
            handleSendMessage={handleSendMessage}
            lobbyMessages={lobbyMessages}
            setGamesToInit={setGamesToInit}
            setRemoveRelayConnections={setRemoveRelayConnections}
            setAddRelayConnections={setAddRelayConnections}
          />

          {activePlayerId &&
          selectedLobbyId &&
          connections.get(selectedLobbyId)?.readyState === 1 ? (
            <GameConsole
              activePlayerId={activePlayerId}
              nostrProfile={nostrProfileData}
              sendMessage={(id, msg) => handleSendMessage(id, msg)}
              sendLobbyMessage={(id, msg) => handleSendMessage(id, msg)}
              gamesToInit={gamesToInit}
              gameConnections={
                new Map(
                  Array.from(connections.entries()).filter(
                    ([_, connection]) => connection.type === "game"
                  )
                )
              }
              setAddRelayConnections={setAddRelayConnections}
              setGamesToInit={setGamesToInit}
              gameMessages={gameMessages}
              setRemoveRelayConnections={setRemoveRelayConnections}
              messages={messages}
              lobbyId={selectedLobbyId}
            />
          ) : (
            <p className="text-center text-gray-500 italic">
              Game not started or lobby not connected...
            </p>
          )}

          <MessagesUI
            title="All Messages"
            messageGroups={[
              {
                title: "Received",
                msgs: Object.values(messages).flat(),
              },
              {
                title: "Sent",
                msgs: Object.values(sentMessages).flat(),
              },
            ]}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
