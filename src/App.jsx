import React, { useState, useEffect, useRef, useCallback } from "react";
import Players from "./components/Players";
import Dashboard from "./components/Dashboard";
import "./App.css";
//import "bootstrap/dist/css/bootstrap.min.css";
import ErrorBoundary from "./ErrorBoundary";
import Lobby from "./components/Lobby";
import GameConsole from "./components/GameConsole";
import { JsonView } from "react-json-view-lite";
import { v4 as uuidv4 } from "uuid";
import useMessages from "./components/hooks/useMessages";
import RelayManager from "./components/RelayManager";
import pognClientConfigs from "./pognClientConfigs";
import { useIrisPlayerId } from "./components/hooks/useIrisDB";
import { useNostrExtensionKey } from "./components/hooks/useNostrExtensionKey";
import GameInviteModal from "./components/GameInviteModal";
import useNostrProfile from "./components/hooks/useNostrProfile";
import { useLocalState } from "irisdb-hooks";

console.log("pognClientConfigs", pognClientConfigs);
//
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
  const [lobbyConnectionsInit, setLobbyConnectionsInit] = useState(false);
  const [selectedLobbyId, setSelectedLobbyId] = useState(null);
  const [signedInLobbies, setSignedInLobbies] = useState(new Set());
  const [createLobbyId, setCreateLobbyId] = useState("lobby3");
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [lobbyConnectId, setLobbyConnectId] = useState("lobby3");
  const [selectedRelayId, setSelectedRelayId] = useState(null);
  const [lobbyConnectUrl, setLobbyConnectUrl] = useState(
    pognClientConfigs.LOBBY_WS_URL
  );
  const [connections, setConnections] = useState(new Map());
  // const [irisPlayerId, setIrisPlayerId] = useIrisPlayerId(
  //   "lobby1",
  //   pognClientConfigs.LOBBY_WS_URL
  // );
  const [irisPlayerId, setIrisPlayerId] = useLocalState("user/publicKey", "");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteGameId, setInviteGameId] = useState(null);
  const [urlParams, setUrlParams] = useState({});
  const [allKeys, setAllKeys] = useState([]);
  const { nostrPubkey } = useNostrExtensionKey();

  const {
    messages,
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
    setRemoveRelayConnections,
    setSignedInLobbies,
    showInviteModal
  );

  const { profile: nostrProfile, follows, followProfiles } = useNostrProfile();

  useEffect(() => {
    if (!activePlayerId) {
      if (nostrPubkey) {
        console.log("🎯 No activePlayerId — using nostrPubkey:", nostrPubkey);
        setActivePlayerId(nostrPubkey);
      } else if (irisPlayerId) {
        console.log("🎯 No activePlayerId — using irisPlayerId:", irisPlayerId);
        setActivePlayerId(irisPlayerId);
      } else if (allKeys.length > 0) {
        console.log("🎯 No activePlayerId — using allKeys[0]:", allKeys[0]);
        setActivePlayerId(allKeys[0]);
      }
    }
  }, [activePlayerId, nostrPubkey, irisPlayerId, allKeys]);

  useEffect(() => {
    console.log("Player ID from IrisDB:", irisPlayerId);
    console.log("Player ID:", activePlayerId);
    if (activePlayerId && activePlayerId !== irisPlayerId) {
      setIrisPlayerId(activePlayerId);
    }
  }, [activePlayerId, irisPlayerId, setIrisPlayerId]);

  useEffect(() => {
    setLobbyConnectUrl(pognClientConfigs.LOBBY_WS_URL);
    setLobbyConnectId("lobby1");
  }, []);

  useEffect(() => {
    if (lobbyConnectionsInit) {
      console.warn(
        "⚠️ Already connected to lobbies. Skipping lobby connecting..."
      );
      return;
    }
    if (!activePlayerId) {
      console.warn("⚠️ Player ID not set. Skipping lobby connecting...");
      return;
    }

    console.log("✅ Setting lobby and game URLs...");
    const initialLobbyUrls = [
      {
        id: "lobby1",
        url: pognClientConfigs.LOBBY_WS_URL,
        type: "lobby",
      },
    ];
    console.log("🔧 Cleaning up old WebSocket connections on load...");

    setAddRelayConnections(initialLobbyUrls);
    setLobbyConnectionsInit(true);
  }, [lobbyConnectionsInit, activePlayerId]);

  useEffect(() => {
    console.log("🔥 App.jsx Re-Rendered!");
  });

  useEffect(() => {
    console.log("Connections set", connections);
  }, [connections]);

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

  const gameConnectionsReady = new Map(
    Array.from(connections.entries()).filter(
      ([id, conn]) => conn.type === "game" && conn.readyState === 1
    )
  );

  const hasInviteUrlBeenProcessed = useRef(false);
  const hasInviteModalBeenShown = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsed = Object.fromEntries(params.entries());

    if (parsed.invite === "true" && !hasInviteUrlBeenProcessed.current) {
      console.log("🔑 Invite URL detected. Processing...");
      hasInviteUrlBeenProcessed.current = true;

      setUrlParams(parsed);
      setAllKeys((prev) =>
        prev.includes(parsed.playerId) ? prev : [...prev, parsed.playerId]
      );
      setActivePlayerId(parsed.playerId);
    }
  }, []);

  useEffect(() => {
    if (
      hasInviteUrlBeenProcessed.current &&
      !hasInviteModalBeenShown.current &&
      connections.get("lobby1")?.readyState === 1
    ) {
      console.log("🟢 Showing invite modal...");
      hasInviteModalBeenShown.current = true;
      setShowInviteModal(true);
    }
  }, [connections]);

  // const [showNoteModal, setShowNoteModal] = useState(true);
  // const postNote = async (note) => {
  //   if (!activePlayerId) return;
  //   const message = {
  //     payload: {
  //       type: "game",
  //       action: "postNote",
  //       playerId: activePlayerId,
  //       note,
  //     },
  //   };
  //   handleSendMessage(activePlayerId, message);
  //   setShowNoteModal(false);
  // };

  return (
    <ErrorBoundary>
      {/* <NoteGameResults
        playerId={activePlayerId}
        nostrPubkey={nostrPubkey}
        nostrProfile={nostrProfile}
        follows={follows}
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onConfirm={postNote}
        gameSummary={`Player1 beat Player2 in Rock Paper Scissors!\nFinal move: Rock vs Scissors`}
        sendMessage={(id, msg) => handleSendMessage(id, msg)}
        message={Object.values(messages).flat().slice(-1)[0] || {}}
      /> */}
      {showInviteModal &&
        Array.from(connections.values()).some(
          (conn) => conn.readyState === 1
        ) && (
          <GameInviteModal
            isOpen={showInviteModal}
            setIsOpen={false}
            onClose={() => setShowInviteModal(false)}
            urlParams={urlParams}
            onJoinWithId={(id) => {
              setShowInviteModal(false);
              setActivePlayerId(id);
            }}
            setActivePlayerId={setActivePlayerId}
            sendMessage={(id, msg) => handleSendMessage(id, msg)}
            lastGameInviteMessage={gameInviteMessages?.slice(-1)[0] || {}}
            connections={connections}
            allKeys={allKeys}
            setAllKeys={setAllKeys}
          />
        )}

      <div className="container mt-5">
        <h1>POGN Client</h1>
        <h2 className="mt-2">Poker and Other Game On NOSTR</h2>
        <Players
          activePlayerId={activePlayerId}
          setActivePlayerId={setActivePlayerId}
          allKeys={allKeys}
          setAllKeys={setAllKeys}
        />
        {activePlayerId && (
          <Dashboard
            playerName="Player"
            playerId={activePlayerId}
            nostrProfile={nostrProfile}
            follows={follows}
            followProfiles={followProfiles}
          />
        )}
        <div className="mt-3">
          {/* {connections.size > 0 ? (
            <> */}
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
        </div>

        <div className="mt-3 w-100 text-start">
          <h4 className="mb-2">Create Lobby:</h4>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <select
              className="form-select"
              style={{ width: "200px" }}
              value={selectedConnectionId}
              onChange={(e) => setSelectedConnectionId(e.target.value)}
            >
              <option value="">Select Relay</option>
              {connectedLobbies.map(([id, conn]) => (
                <option key={id} value={id}>
                  {id} - {conn.url}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="form-control"
              placeholder="Lobby ID"
              style={{ width: "150px" }}
              value={createLobbyId}
              onChange={(e) => setCreateLobbyId(e.target.value)}
            />

            <button
              className="btn btn-secondary"
              disabled={!selectedConnectionId || !createLobbyId}
              onClick={() => {
                const connection = connections.get(selectedConnectionId);
                if (connection?.readyState === 1) {
                  sendMessageToUrl(selectedConnectionId, {
                    payload: {
                      type: "lobby",
                      action: "createLobby",
                      lobbyId: createLobbyId,
                      activePlayerId,
                    },
                    uuid: uuidv4(),
                    relayId: selectedConnectionId,
                  });

                  console.log("🎯 Sent createLobby to", selectedConnectionId);
                } else {
                  console.warn(`Connection ${selectedConnectionId} not ready`);
                }
              }}
            >
              Create Lobby
            </button>
          </div>
        </div>

        <div className="mt-3 w-100 text-start">
          <h4 className="mb-2">Connect to a Lobby Manually:</h4>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              gap: "8px",
            }}
          >
            <input
              type="text"
              className="form-control"
              placeholder="Relay URL"
              style={{ width: "300px" }}
              value={lobbyConnectUrl}
              onChange={(e) => setLobbyConnectUrl(e.target.value)}
            />
            <input
              type="text"
              className="form-control"
              placeholder="LobbyId"
              style={{ width: "200px" }}
              value={lobbyConnectId}
              onChange={(e) => setLobbyConnectId(e.target.value)}
            />
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (!lobbyConnectUrl || !lobbyConnectId) return;
                setAddRelayConnections((prev) => [
                  ...prev,
                  { id: lobbyConnectId, url: lobbyConnectUrl, type: "lobby" },
                ]);
                setLobbyConnectUrl("");
                setLobbyConnectId("");
              }}
            >
              Connect
            </button>
          </div>
        </div>

        <div className="lobbySelect col-md-12 mt-3">
          <h4>Select a Lobby:</h4>

          {/* Lobby selector buttons */}
          <div
            className="border p-2 rounded mb-3"
            style={{ maxHeight: "200px", overflowY: "auto" }}
          >
            {connectedLobbies.map(([id]) => (
              <button
                key={id}
                onClick={() => setSelectedLobbyId(id)}
                className={`btn w-100 text-start mb-1 ${
                  selectedLobbyId === id
                    ? "btn-primary"
                    : "btn-outline-secondary"
                }`}
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {id}
              </button>
            ))}
          </div>

          {/* Only render mounted lobbies that are connected */}
          {connectedLobbies.map(([id, conn]) => (
            <div
              key={id}
              style={{ display: selectedLobbyId === id ? "block" : "none" }}
            >
              <Lobby
                lobbyId={id}
                playerId={activePlayerId}
                sendMessage={(msg) => handleSendMessage(id, msg)}
                message={lobbyMessages[id]?.slice(-1)[0] || {}}
                connectionUrl={conn.url}
                setGamesToInit={setGamesToInit}
                lobbyConnections={connections}
                setRemoveRelayConnections={setRemoveRelayConnections}
                signedInLobbies={signedInLobbies}
                setSignedInLobbies={setSignedInLobbies}
                setAddRelayConnections={setAddRelayConnections}
                nostrPubkey={nostrPubkey}
                follows={follows}
                followProfiles={followProfiles}
              />
            </div>
          ))}
        </div>
        {console.log("Player ID", activePlayerId)}
        {console.log("Games to init", gamesToInit)}
        {console.log("Game connections ready", gameConnectionsReady)}
        {/* {activePlayerId && gamesToInit.size > 0 ? ( */}
        {activePlayerId ? (
          <GameConsole
            playerID={activePlayerId}
            message={Object.values(messages).flat().slice(-1)[0] || {}}
            sendMessage={(id, msg) => handleSendMessage(id, msg)}
            sendLobbyMessage={(id, msg) => handleSendMessage(id, msg)}
            gamesToInit={gamesToInit}
            gameConnections={
              new Map(
                Array.from(connections.entries()).filter(
                  ([id, connection]) => connection.type === "game"
                )
              )
            }
            setAddRelayConnections={setAddRelayConnections}
            setGamesToInit={setGamesToInit}
            gameMessages={gameMessages}
            setRemoveRelayConnections={setRemoveRelayConnections}
            nostrPubkey={nostrPubkey}
            nostrProfile={nostrProfile}
          />
        ) : (
          <p>Game not started...</p>
        )}
        <h3 className="mt-3">Messages Recieved:</h3>

        <div className=" mt-3">
          {/* Render Lobby Messages */}
          {Object.keys(lobbyMessages)
            .sort()
            .map((id, index) => (
              <div key={index}>
                <h5>Lobby Messages from {id}:</h5>

                {lobbyMessages[id].length > 1 && (
                  <details style={{ marginBottom: "8px" }}>
                    <summary>
                      Previous Messages ({lobbyMessages[id].length - 1})
                    </summary>
                    {lobbyMessages[id].slice(0, -1).map((msg, msgIndex) => (
                      <JsonView
                        data={msg}
                        key={`prev-lobby-${id}-${msgIndex}`}
                        shouldExpandNode={() => false} // Always collapsed
                        style={{ fontSize: "14px", lineHeight: "1.2" }}
                      />
                    ))}
                  </details>
                )}

                {/* Last message displayed open */}
                {lobbyMessages[id].slice(-1).map((msg, msgIndex) => (
                  <JsonView
                    data={msg}
                    key={`last-lobby-${id}-${msgIndex}`}
                    shouldExpandNode={(level) => level === 0} // Only expand the first level of the latest message
                    style={{ fontSize: "14px", lineHeight: "1.2" }}
                  />
                ))}
              </div>
            ))}
          {/* Render Game Messages */}
          {Object.keys(gameMessages)
            .sort()
            .map((id, index) => (
              <div key={index}>
                <h5>Game Messages from {id}:</h5>

                {gameMessages[id].length > 1 && (
                  <details style={{ marginBottom: "8px" }}>
                    <summary>
                      Previous Messages ({gameMessages[id].length - 1})
                    </summary>
                    {gameMessages[id].slice(0, -1).map((msg, msgIndex) => (
                      <JsonView
                        data={msg}
                        key={`prev-game-${id}-${msgIndex}`}
                        shouldExpandNode={() => false} // Always collapsed
                        style={{ fontSize: "14px", lineHeight: "1.2" }}
                      />
                    ))}
                  </details>
                )}

                {/* Last message displayed open */}
                {gameMessages[id].slice(-1).map((msg, msgIndex) => (
                  <JsonView
                    data={msg}
                    key={`last-game-${id}-${msgIndex}`}
                    shouldExpandNode={(level) => level === 0} // Only expand the first level of the latest message
                    style={{ fontSize: "14px", lineHeight: "1.2" }}
                  />
                ))}
              </div>
            ))}
          <h3 className="mt-3">All Messages:</h3>
          {Object.values(messages)
            .flat()
            .map((msg, index, arr) => (
              <div key={index}>
                <JsonView
                  data={msg}
                  shouldExpandNode={(level, value, field) =>
                    level === 0 || field === "payload"
                  }
                  style={{
                    fontSize: "14px",
                    lineHeight: "1.2",
                    marginBottom: "8px",
                  }}
                />
              </div>
            ))}
        </div>
      </div>
      {/* )} */}
    </ErrorBoundary>
  );
};

export default App;
