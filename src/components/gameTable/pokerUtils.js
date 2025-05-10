export function getBlindIndexes(dealerIndex, totalPlayers) {
  const sbIndex = (dealerIndex + 1) % totalPlayers;
  const bbIndex = (dealerIndex + 2) % totalPlayers;
  return { sbIndex, bbIndex };
}

export function getFirstToActIndex(
  dealerIndex,
  totalPlayers,
  isPreflop = true
) {
  if (isPreflop) {
    // Preflop: first to act is left of BB
    return (dealerIndex + 3) % totalPlayers;
  } else {
    // Postflop: first to act is left of dealer
    return (dealerIndex + 1) % totalPlayers;
  }
}

export function getTurnPlayer(playersAtTable, startIndex) {
  const total = playersAtTable.length;
  for (let i = 0; i < total; i++) {
    const idx = (startIndex + i) % total;
    if (playersAtTable[idx]) return playersAtTable[idx];
  }
  return null;
}

export function getNextTurnIndex(currentIndex, playersAtTable) {
  const total = playersAtTable.length;
  for (let i = 1; i <= total; i++) {
    const idx = (currentIndex + i) % total;
    if (playersAtTable[idx]) return idx;
  }
  return currentIndex; // fallback
}

export function isRoundOver(playerActions, playersAtTable) {
  const activePlayers = playersAtTable.filter(Boolean);
  const acted = activePlayers.every((id) => playerActions[id]);
  return acted;
}

export function getNextStreet(current) {
  switch (current) {
    case "preflop":
      return "flop";
    case "flop":
      return "turn";
    case "turn":
      return "river";
    case "river":
      return "showdown"; // or "finished"
    default:
      return "preflop";
  }
}
