import React, { useState, useEffect, useRef } from "react";
import "./css/lobby.css";
import { JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import generateAnimalName from "../utils/animalNames.js";
import { verifyLobbyMessage } from "../utils/verifications.js";

const Lobby = ({
  playerId,
  sendMessage,
  message,
  setGamesToInit,
  lobbyId,
  lobbyConnections,
  signedInLobbies,
  setSignedInLobbies,
  nostrPubkey,
  follows = [],
  followProfiles = {},
}) => {
  console.log("Lobby follows", follows);
  console.log("followProfiles", followProfiles);
  const [signedIntoLobby, setSignedIntoLobby] = useState(false);
  const [lobbyGames, setLobbyGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [hasJoined, setHasJoined] = useState(false); // Track if the player has joined the game
  const [isJoining, setIsJoining] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState("odds-and-evens");
  const [selectedGamestate, setSelectedGamestate] = useState({
    players: [],
    lobbyStatus: "",
    maxPlayers: 0,
    minPlayers: 0,
    gameAction: "",
    gameId: "",
  });
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [lobbyMessagesReceived, setLobbyMessagesReceived] = useState([]);
  const [lobbyMessagesSent, setLobbyMessagesSent] = useState([]);
  const [suggestedName, setSuggestedName] = useState("");
  const [isPrivateGame, setIsPrivateGame] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(1); // Default to 2 players
  const [invitedPlayers, setInvitedPlayers] = useState([]); // Array to hold invited players
  const [invitedError, setInvitedError] = useState("");
  const [followSearch, setFollowSearch] = useState("");

  const isSignedIn = signedInLobbies.has(lobbyId);

  const GAME_CONFIGS = {
    "rock-paper-scissors": { maxPlayers: 2 },
    "odds-and-evens": { maxPlayers: 2 },
    // add more games here
  };

  const sendLobbyMessage = (message) => {
    setLobbyMessagesSent((prev) => [...prev, message]); // track sent messages
    sendMessage(message); // call the original send
  };

  const handleLogin = () => {
    const connection = lobbyConnections.get(lobbyId);
    if (connection?.readyState === 1) {
      console.log(`✅ Logging into lobby ${lobbyId}...`);
      sendLobbyMessage({
        payload: {
          type: "lobby",
          action: "login",
          lobbyId,
          playerId,
        },
      });

      // setSignedInLobbies((prev) => new Set(prev).add(lobbyId));
      // setSignedIntoLobby(true);
    } else {
      console.warn(`❌ Lobby ${lobbyId} connection not ready.`);
    }
  };

  useEffect(() => {
    if (playerId) {
      const gameName = generateAnimalName(playerId + Math.random().toString());
      setSuggestedName(gameName);
    }
  }, [playerId]);

  useEffect(() => {
    console.log("Lobby Message Received by Lobby:", message);
    setLobbyMessagesReceived((prev) => [...prev, message]);

    if (!verifyLobbyMessage(message, playerId, lobbyId)) return;
    const { payload } = message;
    const { action } = payload;

    console.log(
      "LobbyId",
      lobbyId,
      "PlayerId",
      playerId,
      "Action",
      action,
      "Payload",
      payload
    );

    switch (action) {
      case "refreshLobby":
        console.log("Game list received:", payload);
        const isPlayerNowInLobby =
          Array.isArray(payload.lobbyPlayers) &&
          payload.lobbyPlayers.includes(playerId);

        if (isPlayerNowInLobby) {
          setSignedInLobbies((prev) => new Set(prev).add(lobbyId));
          setSignedIntoLobby(true);
          console.log(`✅ ${playerId} confirmed in lobby ${lobbyId}`);
        } else {
          setSignedIntoLobby(false);
          console.warn(`⛔ ${playerId} not present in lobby ${lobbyId}`);
        }

        setLobbyGames(payload.lobbyGames || []);
        setLobbyPlayers(payload.lobbyPlayers || []);
        console.log("selectedGameId", selectedGameId);
        const playerGames = payload.lobbyGames.filter((game) =>
          game.players?.includes(playerId)
        );

        console.log("playerGames", playerGames);

        if (playerGames.length > 0) {
          console.log("Player is in a valid game:", playerGames);
          console.log(playerGames);
          console.log(
            "Setting games to init:",
            playerGames,
            "For lobbyId:",
            lobbyId
          );

          const gamesMissingRelay = playerGames.filter((game) => !game.relayId);
          if (gamesMissingRelay.length > 0) {
            console.error(
              "⚠️ Some games are missing relayId:",
              gamesMissingRelay
            );
          }

          setGamesToInit((prev) => {
            const updatedMap = new Map(prev);
            updatedMap.set(lobbyId, playerGames);
            return updatedMap;
          });
          setIsJoining(false);

          const gameId = playerGames[0].gameId; // Get the first gameId from the filtered games
          setSelectedGameId(gameId); // Highlight the selected game
          setSelectedGamestate((prevState) => ({
            ...prevState,
            ...playerGames[0],
          }));
          const isPlayerInGame =
            Array.isArray(playerGames[0].players) &&
            playerGames[0].players.includes(String(playerId));
          setHasJoined(isPlayerInGame); // ✅ this was missing
        } else {
          console.log("Player is not in any valid game. Staying in the lobby.");
          setSelectedGameId(null);
          setHasJoined(false);
        }
        break;
      default:
        console.warn(`Unhandled action: ${action}`);
    }
  }, [message, playerId]);

  const handleSelect = (gameId) => {
    console.log(lobbyGames, gameId);
    const selectedGame = lobbyGames.find((game) => game.gameId === gameId);
    console.log("Selected Game:", selectedGame);

    if (selectedGame) {
      if (selectedGame.players?.length > 0) {
        console.log(
          "Type of selectedGame.players[0]:",
          typeof selectedGame.players[0],
          selectedGame.players[0]
        );
      }
      console.log("Type of playerId:", typeof playerId, playerId);

      const isPlayerInGame =
        Array.isArray(selectedGame.players) &&
        selectedGame.players.includes(String(playerId));

      console.log("isPlayerInGame", isPlayerInGame);
      setIsJoining(false);
      setHasJoined(isPlayerInGame); // Correctly update hasJoined state
      setSelectedGameId(gameId); // Highlight the selected game
      setSelectedGamestate((prevState) => ({
        ...prevState,
        ...selectedGame,
      }));

      console.log(
        `Selected Game ID: ${gameId}, Player in Game: ${isPlayerInGame}`
      );
    }
  };

  const handleListGames = () => {
    console.log(`${playerId} listing games...`);
    sendLobbyMessage({
      payload: {
        type: "lobby",
        lobbyId: lobbyId,
        action: "refreshLobby",
        playerId,
      },
    });
  };

  const handleCreateGame = () => {
    if (isPrivateGame) {
      const trimmedPlayers = invitedPlayers.map((id) => (id || "").trim());
      const allFilled =
        trimmedPlayers.length === maxPlayers &&
        trimmedPlayers.every((id) => id.length >= 8);
      if (!allFilled) {
        setInvitedError("Please enter a valid ID (8+ chars) for each player.");
        return;
      }
      setInvitedError(""); // Clear error

      sendLobbyMessage({
        payload: {
          type: "lobby",
          lobbyId,
          action: "createNewGame",
          gameType: selectedGameType,
          playerId,
          gameId: suggestedName,
          params: {
            private: true,
            allowedPlayers: trimmedPlayers,
          },
        },
      });
    } else {
      sendLobbyMessage({
        payload: {
          type: "lobby",
          lobbyId,
          action: "createNewGame",
          gameType: selectedGameType,
          playerId,
          gameId: suggestedName,
        },
      });
    }
  };

  const handleJoinGame = () => {
    //check if game isPrivate and if playerId is .allowedPlayers
    console.log("Selected game state:", selectedGamestate);
    const isPrivateGame = selectedGamestate.isPrivate;
    console.log("Is private game:", isPrivateGame);
    if (isPrivateGame) {
      console.log("Private game detected.");
      const isPlayerAllowed =
        selectedGamestate.allowedPlayers?.includes(playerId);
      if (!isPlayerAllowed) {
        console.log("Player not invited to  private game.");
        alert("❌ You are not invited to join this private game.");
        return;
      } else {
        //setInvitedError(""); // Clear error if player is allowed
        console.log("nostrPubkey", nostrPubkey);
        if (!nostrPubkey) {
          alert(
            "❌ Login with a nostr extension like nos2x to join private games."
          );
          return;
        }
        if (nostrPubkey !== playerId) {
          alert(
            "❌ Your nostr id doesn't match the invitation playerId. Can't join private game!"
          );
          return;
        }
      }
    }

    console.log(`${playerId} joining game... ${selectedGamestate.gameId}`);
    setIsJoining(true);
    sendLobbyMessage({
      payload: {
        type: "lobby",
        lobbyId: lobbyId,
        action: "joinGame",
        playerId,
        gameId: selectedGamestate.gameId,
      },
    });
  };

  const connectionState = lobbyConnections.get(lobbyId)?.readyState;
  console.log(lobbyConnections);
  console.log("Connection state:", connectionState);
  const connectionColor =
    connectionState === 1 ? "green" : connectionState === 3 ? "red" : "yellow";
  console.log("Connection color:", connectionColor);

  const connectionTitle =
    connectionState === 1
      ? "Connected"
      : connectionState === 0
      ? "Connecting..."
      : connectionState === 2
      ? "Closing..."
      : "Disconnected";
  console.log("Connection title:", connectionTitle);

  useEffect(() => {
    if (signedIntoLobby && playerId && lobbyId) {
      console.log("✅ Triggering refreshLobby after login for:", lobbyId);
      sendLobbyMessage({
        payload: {
          type: "lobby",
          action: "refreshLobby",
          playerId,
          lobbyId,
        },
      });
    }
  }, [signedIntoLobby]);

  useEffect(() => {
    if (isPrivateGame && selectedGameType) {
      const config = GAME_CONFIGS[selectedGameType];
      if (config) {
        setMaxPlayers(config.maxPlayers);

        // Auto-fill your own playerId as the first invited player
        setInvitedPlayers((prev) => {
          const updated = [...prev];
          updated[0] = playerId; // Ensure index 0 is always yours
          return updated;
        });
      }
    }
  }, [selectedGameType, isPrivateGame, playerId]);

  return (
    <div className="lobby">
      <div
        key={lobbyId}
        style={{
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #ccc",
        }}
      >
        <h5>Lobby ID: {lobbyId}</h5>
        {!isSignedIn ? (
          <button className="btn btn-secondary mb-3" onClick={handleLogin}>
            Login to Lobby
          </button>
        ) : (
          <>
            <div className="d-flex  mb-2">
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: connectionColor,
                  border: "1px solid #333",
                }}
                title={connectionTitle}
              ></div>
              <div style={{ marginLeft: "10px" }}>
                <p> {connectionTitle}</p>
              </div>
            </div>
            {/* </div> */}
          </>
        )}
        {/* </div> */}
        {isSignedIn && (
          <>
            <div className="lobbyMessages d-flex flex-row">
              <div>
                <h6>Received</h6>
                {/* Previous Messages collapsed in a <details> section */}
                {Array.isArray(lobbyMessagesReceived) &&
                  lobbyMessagesReceived.length > 1 && (
                    <details style={{ marginBottom: "8px" }}>
                      <summary>
                        Previous Messages ({lobbyMessagesReceived.length - 1})
                      </summary>
                      {lobbyMessagesReceived.slice(0, -1).map((msg, index) => (
                        <div
                          className="jsonMessage"
                          key={`prev-lobby-msg-${index}`}
                        >
                          <JsonView
                            data={msg}
                            shouldExpandNode={() => false} // keep these collapsed
                            style={{ fontSize: "14px", lineHeight: "1.2" }}
                          />
                        </div>
                      ))}
                    </details>
                  )}
                {/* Last message shown expanded */}
                {lobbyMessagesReceived.slice(-1).map((msg, index) => (
                  <div className="jsonMessage" key={`prev-lobby-msg-${index}`}>
                    <JsonView
                      data={msg}
                      key={`last-lobby-msg-${index}`}
                      shouldExpandNode={(level, value, field) =>
                        level === 0 || field === "payload"
                      }
                      style={{ fontSize: "14px", lineHeight: "1.2" }}
                    />
                  </div>
                ))}
              </div>
              <div>
                <h6>Sent</h6>

                {/* Previous Messages collapsed in a <details> section */}
                {Array.isArray(lobbyMessagesSent) &&
                  lobbyMessagesSent.length > 1 && (
                    <details style={{ marginBottom: "8px" }}>
                      <summary>
                        Previous Messages ({lobbyMessagesSent.length - 1})
                      </summary>
                      {lobbyMessagesSent.slice(0, -1).map((msg, index) => (
                        <div
                          className="jsonMessage"
                          key={`prev-lobby-msg-${index}`}
                        >
                          <JsonView
                            data={msg}
                            key={`prev-lobby-sent-msg-${index}`}
                            shouldExpandNode={() => false}
                            style={{ fontSize: "14px", lineHeight: "1.2" }}
                          />
                        </div>
                      ))}
                    </details>
                  )}

                {/* Last message shown expanded */}
                {lobbyMessagesSent.slice(-1).map((msg, index) => (
                  <div className="jsonMessage" key={`prev-lobby-msg-${index}`}>
                    <JsonView
                      data={msg}
                      key={`last-lobby-sent-msg-${index}`}
                      shouldExpandNode={(level, value, field) =>
                        level === 0 || field === "payload"
                      }
                      style={{ fontSize: "14px", lineHeight: "1.2" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="lobbyPlayers">
              <h5>Players in Lobby: {lobbyPlayers.length}</h5>
              <ul>
                {lobbyPlayers.length > 0 ? (
                  lobbyPlayers.map((player, index) => (
                    <li key={player}>
                      <strong>Player {index + 1}:</strong>{" "}
                      <span title={player}>
                        {player.length > 20
                          ? `${player.slice(0, 8)}...${player.slice(-8)}`
                          : player}
                      </span>
                    </li>
                  ))
                ) : (
                  <li>No players connected yet</li>
                )}
              </ul>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <h3 className="mt-3">Create New Game:</h3>
              <label
                htmlFor="gameTypeSelect"
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "4px",
                }}
              >
                Select New Game Type:
              </label>

              <select
                id="gameTypeSelect"
                value={selectedGameType}
                onChange={(e) => setSelectedGameType(e.target.value)}
              >
                {Object.entries(GAME_CONFIGS).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {key
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>

              {/* <select
                id="gameTypeSelect"
                value={selectedGameType}
                onChange={(e) => setSelectedGameType(e.target.value)}
              >
                <option value="rock-paper-scissors" maPlayers="2">Rock Paper Scissors</option>
                <option value="odds-and-evens" maxPlayers="2">Odds and Evens</option>
              </select> */}
              <div style={{ marginBottom: "5px" }}>
                <label
                  htmlFor="gameNameInput"
                  style={{
                    display: "block",
                    fontWeight: "bold",
                    marginBottom: "4px",
                  }}
                >
                  New GameId:
                </label>
                <input
                  id="gameNameInput"
                  type="text"
                  value={suggestedName}
                  onChange={(e) => setSuggestedName(e.target.value)}
                  placeholder="Enter game name"
                  style={{
                    marginBottom: "5px",
                    padding: "5px",
                    width: "100%",
                  }}
                />
              </div>

              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="privateGameCheck"
                  checked={isPrivateGame}
                  onChange={() => setIsPrivateGame(!isPrivateGame)}
                />
                <label className="form-check-label" htmlFor="privateGameCheck">
                  Create Private Game
                </label>
              </div>

              {/* {isPrivateGame && follows.length > 0 && (
                <div className="mb-3">
                  <h6>Select Players to Invite:</h6>
                  <div
                    style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
                  >
                    {follows.slice(0, 5).map((f) => {
                      const profile = followProfiles[f] || {};
                      const name =
                        profile.display_name || profile.name || f.slice(0, 12);
                      const pic = profile.picture;

                      const isSelected = invitedPlayers.includes(f);
                      return (
                        <div
                          key={f}
                          onClick={() => {
                            setInvitedPlayers((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== f)
                                : [...prev, f]
                            );
                          }}
                          style={{
                            cursor: "pointer",
                            border: isSelected
                              ? "2px solid green"
                              : "1px solid #ccc",
                            padding: "6px",
                            borderRadius: "6px",
                            textAlign: "center",
                            width: "100px",
                          }}
                        >
                          <img
                            src={pic || "/fallback-avatar.png"}
                            alt="pfp"
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                          <div style={{ fontSize: "0.75em", marginTop: "4px" }}>
                            {name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )} */}
              {isPrivateGame && follows.length > 0 && (
                <div className="mb-3">
                  <h6>Invite Players:</h6>

                  <input
                    type="text"
                    placeholder="Search follows..."
                    className="form-control mb-2"
                    value={followSearch}
                    onChange={(e) => setFollowSearch(e.target.value)}
                  />

                  <div
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    {follows
                      .filter((f) => {
                        const profile = followProfiles[f] || {};
                        const name = profile.display_name || profile.name || "";
                        return (
                          f !== playerId &&
                          (!followSearch ||
                            name
                              .toLowerCase()
                              .includes(followSearch.toLowerCase()) ||
                            f.startsWith(followSearch))
                        );
                      })
                      .slice(0, 100)
                      .map((f) => {
                        const profile = followProfiles[f] || {};
                        const name =
                          profile.display_name ||
                          profile.name ||
                          f.slice(0, 12);
                        const pic = profile.picture;
                        const isSelected = invitedPlayers.includes(f);

                        return (
                          <div
                            key={f}
                            onClick={() => {
                              setInvitedPlayers((prev) => {
                                // Always include the current player at index 0
                                const others = prev.slice(1);
                                const isSelected = others.includes(f);
                                const maxOthers = maxPlayers - 1;

                                if (isSelected) {
                                  return [
                                    playerId,
                                    ...others.filter((id) => id !== f),
                                  ];
                                } else {
                                  if (others.length < maxOthers) {
                                    return [playerId, ...others, f];
                                  } else {
                                    // Replace the last selected with the new one
                                    return [
                                      playerId,
                                      ...others.slice(0, maxOthers - 1),
                                      f,
                                    ];
                                  }
                                }
                              });
                            }}
                            style={{
                              cursor: "pointer",
                              border: isSelected
                                ? "2px solid green"
                                : "1px solid #ccc",
                              padding: "6px",
                              borderRadius: "6px",
                              textAlign: "center",
                              width: "100px",
                              backgroundColor: isSelected ? "#e6ffe6" : "white",
                            }}
                          >
                            <img
                              src={pic || "/fallback-avatar.png"}
                              alt="pfp"
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                            <div
                              style={{ fontSize: "0.75em", marginTop: "4px" }}
                            >
                              {name}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="mt-2" style={{ fontSize: "0.9em" }}>
                    Selected: {invitedPlayers.length} / {maxPlayers - 1}
                  </div>
                </div>
              )}

              {isPrivateGame && (
                <>
                  <div className="mb-2">
                    <label className="fw-bold">
                      Enter the IDs of the players allowed to join:
                    </label>
                    {invitedError && (
                      <div
                        className="text-danger mt-1"
                        style={{ fontSize: "0.875rem" }}
                      >
                        {invitedError}
                      </div>
                    )}
                  </div>

                  {[...Array(maxPlayers)].map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      className="form-control mb-1"
                      placeholder={`Player ID ${i + 1}`}
                      value={invitedPlayers[i] || (i === 0 ? playerId : "")}
                      disabled={i === 0}
                      onChange={(e) => {
                        const copy = [...invitedPlayers];
                        copy[i] = e.target.value;
                        setInvitedPlayers(copy);
                      }}
                    />
                  ))}
                </>
              )}

              <button
                onClick={handleCreateGame}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                Create New Game
              </button>

              <button
                onClick={handleListGames}
                className="px-4 py-2 rounded bg-green-600 hover:bg-blue-700 text-white font-semibold"
              >
                Refresh Games
              </button>

              <button
                onClick={handleJoinGame}
                disabled={
                  hasJoined ||
                  isJoining ||
                  lobbyPlayers.length === 0 ||
                  !selectedGamestate.gameId ||
                  selectedGamestate.players.length >=
                    selectedGamestate.instance.maxPlayers
                }
                className={`px-4 py-2 rounded font-semibold text-white ${
                  hasJoined ||
                  isJoining ||
                  lobbyPlayers.length === 0 ||
                  !selectedGamestate.gameId ||
                  selectedGamestate.players.length >=
                    selectedGamestate.instance.maxPlayers
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {hasJoined ? "Joined" : isJoining ? "Joining..." : "Join Game"}
              </button>
            </div>
            <div className="lobbyGames">
              <div className="selectedGameState jsonMessage">
                <h5>Selected Game State</h5>
                <JsonView
                  data={selectedGamestate}
                  shouldExpandNode={(level) => level === 0} // Expand only the first level
                  style={{ fontSize: "14px", lineHeight: "1.2" }}
                />
              </div>
              {/* {isPrivateGame && follows.length > 0 && (
                <div className="mb-3">
                  <h6>Invite Players:</h6>

                  <input
                    type="text"
                    placeholder="Search follows..."
                    className="form-control mb-2"
                    value={followSearch}
                    onChange={(e) => setFollowSearch(e.target.value)}
                  />

                  <div
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    {follows
                      .filter((f) => {
                        const profile = followProfiles[f] || {};
                        const name = profile.display_name || profile.name || "";
                        return (
                          f !== playerId &&
                          invitedPlayers.length < maxPlayers &&
                          (!followSearch ||
                            name
                              .toLowerCase()
                              .includes(followSearch.toLowerCase()) ||
                            f.startsWith(followSearch))
                        );
                      })
                      .slice(0, 100) // cap rendering in case you have a lot
                      .map((f) => {
                        const profile = followProfiles[f] || {};
                        const name =
                          profile.display_name ||
                          profile.name ||
                          f.slice(0, 12);
                        const pic = profile.picture;
                        const isSelected = invitedPlayers.includes(f);

                        return (
                          <div
                            key={f}
                            onClick={() => {
                              setInvitedPlayers((prev) =>
                                isSelected
                                  ? prev.filter((id) => id !== f)
                                  : prev.length < maxPlayers &&
                                    !prev.includes(f)
                                  ? [...prev, f]
                                  : prev
                              );
                            }}
                            style={{
                              cursor: "pointer",
                              border: isSelected
                                ? "2px solid green"
                                : "1px solid #ccc",
                              padding: "6px",
                              borderRadius: "6px",
                              textAlign: "center",
                              width: "100px",
                              backgroundColor: isSelected ? "#e6ffe6" : "white",
                            }}
                          >
                            <img
                              src={pic || "/fallback-avatar.png"}
                              alt="pfp"
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                            <div
                              style={{ fontSize: "0.75em", marginTop: "4px" }}
                            >
                              {name}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="mt-2" style={{ fontSize: "0.9em" }}>
                    Selected: {invitedPlayers.length} / {maxPlayers - 1}
                  </div>
                </div>
              )} */}

              {/* {selectedGamestate.isPrivate &&
                Array.isArray(selectedGamestate.allowedPlayers) &&
                selectedGamestate.allowedPlayers.length > 0 && (
                  <div className="inviteLinks mb-3">
                    <h5>🔗 Invite Links:</h5>
                    <ul className="list-group">
                      {selectedGamestate.allowedPlayers.map((id, i) => {
                        const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=true&gameId=${selectedGamestate.gameId}&playerId=${id}`;
                        return (
                          <li key={id} className="list-group-item">
                            <strong>Player {i + 1}:</strong>
                            <br />
                            <code style={{ wordBreak: "break-all" }}>
                              {inviteUrl}
                            </code>
                            <br />
                            <button
                              className="btn btn-sm btn-outline-primary mt-1"
                              onClick={() => {
                                navigator.clipboard.writeText(inviteUrl);
                                alert("Copied to clipboard!");
                              }}
                            >
                              Copy Link
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )} */}

              {lobbyGames.length > 0 ? (
                <ul>
                  {lobbyGames.map((game, index) => (
                    <li
                      className="lobbyGame"
                      key={index}
                      onClick={() => handleSelect(game.gameId)} // Handle click to select the game
                      style={{
                        cursor: "pointer",
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "5px",
                        margin: "5px 0",
                        backgroundColor:
                          selectedGameId === game.gameId ? "#d3f9d8" : "#fff", // Highlight selected
                        fontWeight:
                          selectedGameId === game.gameId ? "bold" : "normal", // Bold selected
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <strong>Game {index + 1}:</strong> {game.gameId}
                        </div>
                        {game.players?.includes(playerId) && (
                          <span
                            style={{
                              backgroundColor: "#28a745",
                              color: "white",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            Joined
                          </span>
                        )}
                      </div>
                      <div>
                        <strong>Game Type:</strong> {game.gameType}
                      </div>
                      <div>
                        <div>
                          <strong>Players:</strong>{" "}
                          {Object.keys(game.players || {}).length} /{" "}
                          {game.instance?.maxPlayers || "N/A"}
                        </div>
                        {game.players.length > 0 && (
                          <ul>
                            {game.players.map((playerId, index) => (
                              <li key={`${playerId}-${index}`}>
                                <strong>Player {index + 1}:</strong>{" "}
                                {playerId.length > 10
                                  ? `${playerId.slice(0, 8)}...${playerId.slice(
                                      -8
                                    )}`
                                  : playerId}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* {game.players &&
                        Object.keys(game.players).length > 0 ? (
                          <ul>
                            {Object.entries(game.players).map(
                              ([playerId, playerData], playerIndex) => (
                                <li key={playerIndex}>
                                  <strong>Player {playerIndex + 1}:</strong>{" "}
                                  {playerId}
                                </li>
                              )
                            )}
                          </ul>
                        ) : (
                          <div>No players connected yet</div>
                        )} */}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No games available</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Lobby;
