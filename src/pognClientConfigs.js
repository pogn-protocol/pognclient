const configs = {
  development: {
    BOOTSTRAP_CONNECTIONS: [
      { id: "lobby1", url: "ws://localhost:8080", type: "lobby" },
      { id: "displayGame", url: "ws://localhost:8080", type: "displayGame" },
      { id: "chat", url: "ws://localhost:8080", type: "chat" },
    ],
  },
  production: {
    BOOTSTRAP_CONNECTIONS: [
      {
        id: "lobby1",
        url: "wss://pogn-a5fe730540b4.herokuapp.com/",
        type: "lobby",
      },
      {
        id: "displayGame",
        url: "wss://pogn-a5fe730540b4.herokuapp.com/",
        type: "displayGame",
      },
      {
        id: "chat",
        url: "wss://pogn-a5fe730540b4.herokuapp.com/",
        type: "chat",
      },
    ],
  },
};

const env = import.meta.env.MODE || "development";
export default configs[env];
