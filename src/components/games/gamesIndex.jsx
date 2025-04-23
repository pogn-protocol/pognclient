// ./games/index.js
import RockPaperScissors from "./RockPaperScissors";
import OddsAndEvens from "./OddsAndEvens";
import TicTacToe from "./TicTacToe";

const gameComponents = {
  "rock-paper-scissors": RockPaperScissors,
  "odds-and-evens": OddsAndEvens,
  "tic-tac-toe": TicTacToe,
};

export default gameComponents;
