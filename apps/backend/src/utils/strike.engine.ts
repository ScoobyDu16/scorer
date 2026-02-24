type StrikeInput = {
  strikerId: string;
  nonStrikerId: string;
  newBatsmanId?: string; // when wicket falls
  runs: number; // runs completed (including byes/leg byes)
  isLegalDelivery: boolean;
  ballNumber: number;
  isWicket: boolean;
  wicketType?:
    | "BOWLED"
    | "CAUGHT"
    | "RUN_OUT"
    | "LBW"
    | "STUMPED"
    | "HIT_WICKET"
    | "RETIRED";
  dismissedPlayerId?: string;
  crossingOccurred?: boolean; // for run-out scenarios
};

export const calculateNextStrike = ({
  strikerId,
  nonStrikerId,
  runs,
  isLegalDelivery,
  ballNumber,
  isWicket,
  wicketType,
  dismissedPlayerId,
  newBatsmanId,
  crossingOccurred = false,
}: StrikeInput) => {
  let nextStriker = strikerId;
  let nextNonStriker = nonStrikerId;

  /**
   * 1️⃣ Handle wickets according to ICC rules
   */
  if (isWicket && dismissedPlayerId && newBatsmanId) {
    const isStrikerOut = dismissedPlayerId === strikerId;

    switch (wicketType) {
      case "CAUGHT":
        // ICC rule: striker is always out, new batsman comes on strike
        nextStriker = newBatsmanId;
        nextNonStriker = strikerId; // original striker becomes non-striker
        break;

      case "RUN_OUT":
        if (isStrikerOut) {
          // Striker run out
          const isOverEnd = isLegalDelivery && ballNumber === 6;
          if (isOverEnd && !crossingOccurred) {
            // Over ended without crossing - striker remains, new batsman at non-striker
            nextStriker = nonStrikerId;
            nextNonStriker = newBatsmanId;
          } else {
            // Normal case - new batsman comes on strike
            nextStriker = newBatsmanId;
            nextNonStriker = nonStrikerId;
          }
        } else {
          // Non-striker run out
          if (runs > 0 && isLegalDelivery) {
            // Runs completed - strike rotates
            nextStriker = newBatsmanId;
            nextNonStriker = strikerId;
          } else {
            // No runs - striker remains
            nextStriker = strikerId;
            nextNonStriker = newBatsmanId;
          }
        }
        break;

      default:
        // Bowled, LBW, Stumped, Hit Wicket, Retired
        if (isStrikerOut) {
          // Striker out - new batsman comes on strike
          nextStriker = newBatsmanId;
          nextNonStriker = nonStrikerId;
        } else {
          // Non-striker out - striker remains
          nextStriker = strikerId;
          nextNonStriker = newBatsmanId;
        }
        break;
    }
  }

  /**
   * 2️⃣ Apply run-based rotation (only for non-caught wickets)
   */
  if (!(isWicket && wicketType === "CAUGHT")) {
    if (runs % 2 === 1) {
      [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
    }
  }

  /**
   * 3️⃣ Over end swap (only if not a caught wicket)
   */
  if (isLegalDelivery && ballNumber === 6 && !(isWicket && wicketType === "CAUGHT")) {
    [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
  }

  return { nextStriker, nextNonStriker };
};
