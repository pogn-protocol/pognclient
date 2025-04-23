import React, { useState, useEffect, useRef } from "react";
import generateAnimalName from "../../utils/animalNames.js";
import { verifyLobbyMessage } from "../../utils/verifications.js";

const Lobby = ({
  sendMessage,
  message,
  setGamesToInit,
  lobbyId,
  lobbyConnections,
  signedInLobbies,
  nostrProfileData,
  LobbyMessagesUI,
  onSignedIn,
  playerId,
}) => {
  console.log("LobbyId", lobbyId);
  console.log("nostrProfileData", nostrProfileData);
  const nostrPubkey = nostrProfileData?.id || "";
  const follows = nostrProfileData?.follows || [];
  const followProfiles = nostrProfileData?.followProfiles || {};
  console.log("Lobby follows", follows);
  console.log("followProfiles", followProfiles);
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

  const isSignedIn = !!(signedInLobbies && signedInLobbies.has(lobbyId));
  console.log("Lobby isSignedIn", isSignedIn);
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
      console.log(
        `✅ Logging into lobby ${lobbyId}... with playerId ${playerId}`
      );
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
          onSignedIn?.(true);
          console.log(`✅ ${playerId} confirmed in lobby ${lobbyId}`);
        } else {
          onSignedIn?.(false);
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
      if (!nostrProfileData || !nostrProfileData.profile) {
        alert("❌ You must be logged in with Nostr to create a private game.");
        return;
      }
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
      <div className="mb-6 p-4 border border-gray-300 rounded-md shadow-sm bg-white">
        <h5 className="text-base font-semibold text-gray-800 mb-3">
          Lobby ID: <span className="font-mono">{lobbyId}</span>
        </h5>

        {!isSignedIn ? (
          <button
            className="mb-3 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
            onClick={handleLogin}
          >
            Login to Lobby
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full border border-gray-700"
              style={{ backgroundColor: connectionColor }}
              title={connectionTitle}
            />
            <p className="text-sm text-gray-700">{connectionTitle}</p>
          </div>
        )}

        {isSignedIn && (
          <>
            <div className="flex flex-row flex-wrap max-w-full px-6">
              {LobbyMessagesUI && (
                <LobbyMessagesUI
                  title={`Lobby ${lobbyId} Messages`}
                  messageGroups={[
                    {
                      title: "Received",
                      msgs: lobbyMessagesReceived,
                    },
                    {
                      title: "Sent",
                      msgs: lobbyMessagesSent,
                    },
                  ]}
                />
              )}
            </div>

            <div className="mt-4">
              <h5 className="text-sm font-semibold text-gray-800 mb-2">
                {lobbyPlayers.length} players in Lobby
              </h5>
              <ul className="list-disc list-inside text-sm text-gray-700 break-words">
                {lobbyPlayers.length > 0 ? (
                  lobbyPlayers.map((player, index) => (
                    <li key={player}>
                      <span title={player}>{player}</span>
                    </li>
                  ))
                ) : (
                  <li>No players connected yet</li>
                )}
              </ul>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <h3 className="text-md font-semibold">Create New Game:</h3>
              <label htmlFor="gameTypeSelect" className="text-sm font-medium">
                Select New Game Type:
              </label>

              <select
                id="gameTypeSelect"
                className="px-3 py-2 border rounded text-sm"
                value={selectedGameType}
                onChange={(e) => setSelectedGameType(e.target.value)}
              >
                {Object.entries(GAME_CONFIGS).map(([key]) => (
                  <option key={key} value={key}>
                    {key
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>

              <label htmlFor="gameNameInput" className="text-sm font-medium">
                New GameId:
              </label>
              <input
                id="gameNameInput"
                type="text"
                className="px-3 py-2 border rounded text-sm"
                value={suggestedName}
                onChange={(e) => setSuggestedName(e.target.value)}
                placeholder="Enter game name"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  className="form-checkbox w-5 h-5 text-green-600 border-gray-400 border-2 rounded focus:ring-green-500"
                  type="checkbox"
                  id="privateGameCheck"
                  checked={isPrivateGame}
                  onChange={() => setIsPrivateGame(!isPrivateGame)}
                />
                <label htmlFor="privateGameCheck" className="text-sm">
                  Create Private Game
                </label>
              </div>

              {/* -- Private Game Invite Block -- */}
              {isPrivateGame && follows.length > 0 && followProfiles && (
                <div className="mt-4">
                  <h6 className="font-semibold text-sm mb-2">
                    Invite Players:
                  </h6>

                  <input
                    type="text"
                    placeholder="Search follows..."
                    className="w-full px-3 py-1 mb-2 border rounded text-sm"
                    value={followSearch}
                    onChange={(e) => setFollowSearch(e.target.value)}
                  />

                  <div className="max-h-52 overflow-y-auto flex flex-wrap gap-2">
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
                            className={`w-[100px] p-2 rounded text-center cursor-pointer text-xs ${
                              isSelected
                                ? "bg-green-100 border-2 border-green-500"
                                : "bg-white border"
                            }`}
                            onClick={() => {
                              setInvitedPlayers((prev) => {
                                const others = prev.slice(1);
                                const isSelected = others.includes(f);
                                const maxOthers = maxPlayers - 1;

                                if (isSelected) {
                                  return [
                                    playerId,
                                    ...others.filter((id) => id !== f),
                                  ];
                                } else if (others.length < maxOthers) {
                                  return [playerId, ...others, f];
                                } else {
                                  return [
                                    playerId,
                                    ...others.slice(0, maxOthers - 1),
                                    f,
                                  ];
                                }
                              });
                            }}
                          >
                            <img
                              src={pic || "/fallback-avatar.png"}
                              alt="pfp"
                              className="w-10 h-10 rounded-full object-cover mx-auto"
                            />
                            <div className="mt-1">{name}</div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="text-xs mt-1">
                    Selected: {invitedPlayers.length} / {maxPlayers - 1}
                  </div>
                </div>
              )}

              {isPrivateGame && (
                <div className="mt-2 space-y-1">
                  <label className="text-sm font-semibold">
                    Enter the IDs of the players allowed to join:
                  </label>
                  {invitedError && (
                    <div className="text-red-600 text-xs">{invitedError}</div>
                  )}
                  {[...Array(maxPlayers)].map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      className="w-full px-3 py-1 border rounded text-sm"
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
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-2 flex-wrap mt-4">
                <button
                  onClick={handleCreateGame}
                  className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold text-sm"
                >
                  Create New Game
                </button>
                <button
                  onClick={handleListGames}
                  className="px-4 py-2 rounded bg-green-600 hover:bg-blue-700 text-white font-semibold text-sm"
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
                  className={`px-4 py-2 rounded font-semibold text-white text-sm ${
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
                  {hasJoined
                    ? "Joined"
                    : isJoining
                    ? "Joining..."
                    : "Join Game"}
                </button>
              </div>
            </div>

            <div className="lobbyGames mt-6">
              <h5 className="text-sm font-semibold text-gray-800 mb-2">
                Games in Lobby
              </h5>

              {lobbyGames.length > 0 ? (
                <ul className="space-y-2">
                  {lobbyGames.map((game, index) => (
                    <li
                      key={game.gameId}
                      onClick={() => handleSelect(game.gameId)}
                      className={`p-3 border rounded cursor-pointer ${
                        selectedGameId === game.gameId
                          ? "bg-green-100 border-green-400 font-semibold"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-mono text-sm">
                            {game.gameId}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {game.gameType}
                          </span>
                        </div>
                        {game.players?.includes(playerId) && (
                          <span className="text-green-700 text-xs font-bold">
                            ✅ Joined
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Players: {game.players.length} /{" "}
                        {game.instance?.maxPlayers || "?"}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No games available yet.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Lobby;
