const configs = {
  development: {
    BOOTSTRAP_CONNECTIONS: [
      { id: "lobby1", url: "ws://localhost:8080", type: "lobby" },
    ],
  },
  production: {
    BOOTSTRAP_CONNECTIONS: [
      {
        id: "lobby1",
        url: "wss://pogn-a5fe730540b4.herokuapp.com/",
        type: "lobby",
      },
    ],
  },
};

const env = import.meta.env.MODE || "development";
export default configs[env];
