import { useLocalState } from "irisdb-hooks";

export const useIrisPlayerId = () => {
  const [playerId, setPlayerId] = useLocalState("user/publicKey", "");
  return [playerId, setPlayerId];
};
