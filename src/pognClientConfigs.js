// src/pognClientConfigs.js

const ENV = import.meta.env.MODE;
//const ENV = "development"; // Change this to "development" for local testing
//const ENV = "production"; // Change this to "production" for production testing

const configs = {
  development: {
    LOBBY_WS_URL: "ws://localhost:8080", // your local lobby relay
    GAME_WS_URL: "ws://localhost:8080", // your local game relay
  },
  production: {
    LOBBY_WS_URL: "wss://pogn-a5fe730540b4.herokuapp.com/", // prod relay address
    GAME_WS_URL: "wss://pogn-a5fe730540b4.herokuapp.com/", // prod game address
  },
};

export default configs[ENV];
