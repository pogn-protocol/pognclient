import React, { useState, useEffect } from "react";
import ErrorBoundary from "./ErrorBoundary";
import GameConsole from "./components/gameConsole/GameConsole";
import useMessages from "./components/hooks/useMessages";
import RelayManager from "./components/connections/RelayManager";
import pognClientConfigs from "./pognClientConfigs";
import ConnectionsUI from "./components/connections/ConnectionsUI";
import Lobbies from "./components/lobby/Lobbies";
import MessagesUI from "./components/messages/MessagesUI";
import Players from "./components/user/Players";
import { useLocalState } from "irisdb-hooks";

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
  const [activePlayerId, setActivePlayerId] = useLocalState(
    "user/publicKey",
    null
  );
  const [gamesToInit, setGamesToInit] = useState(new Map());
  const [sendMessageToUrl, setSendMessageToUrl] = useState(() => () => {});
  const [addRelayConnections, setAddRelayConnections] = useState([]);
  const [removeRelayConnections, setRemoveRelayConnections] = useState([]);
  const [selectedLobbyId, setSelectedLobbyId] = useState(null);
  const [createLobbyId, setCreateLobbyId] = useState("lobby3");
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [selectedRelayId, setSelectedRelayId] = useState(null);
  const [lobbyConnectUrl, setLobbyConnectUrl] = useState(
    pognClientConfigs.LOBBY_WS_URL
  );
  const [connections, setConnections] = useState(new Map());
  const [nostrProfileData, setNostrProfileData] = useState(null);

  const {
    messages,
    sentMessages,
    lobbyMessages,
    gameMessages,
    handleMessage,
    handleSendMessage,
    gameInviteMessages,
  } = useMessages(
    activePlayerId,
    connections,
    sendMessageToUrl,
    setAddRelayConnections,
    setRemoveRelayConnections
  );

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

  return (
    <ErrorBoundary>
      <div className="w-full max-w-[800px] flex flex-col justify-center items-center mx-auto p-4">
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
            connections={connections}
            gameInviteMessages={gameInviteMessages}
            activePlayerId={activePlayerId}
            setNostrProfileData={setNostrProfileData}
          />
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
            connectionType="lobby"
            connections={connections}
            setAddRelayConnections={setAddRelayConnections}
            selectedConnectionId={selectedConnectionId}
            setSelectedConnectionId={setSelectedConnectionId}
            createId={createLobbyId}
            setCreateId={setCreateLobbyId}
            connectUrl={lobbyConnectUrl}
            setConnectUrl={setLobbyConnectUrl}
          />

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

          {activePlayerId ? (
            <GameConsole
              playerId={activePlayerId}
              nostrProfile={nostrProfileData}
              message={Object.values(messages).flat().slice(-1)[0] || {}}
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
              Game not started...
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
