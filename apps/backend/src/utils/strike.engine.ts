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
}: StrikeInput) => {
  let nextStriker = strikerId;
  let nextNonStriker = nonStrikerId;

  /**
   * 1️⃣ Replace dismissed batsman
   */
  if (isWicket && dismissedPlayerId && newBatsmanId) {
    if (dismissedPlayerId === strikerId) {
      nextStriker = newBatsmanId;
    } else {
      nextNonStriker = newBatsmanId;
    }
  }

  /**
   * 2️⃣ CAUGHT — new ICC rule
   * New batsman always striker
   */
  if (isWicket && wicketType === "CAUGHT" && newBatsmanId) {
    nextStriker = newBatsmanId;
    nextNonStriker = dismissedPlayerId === strikerId ? nonStrikerId : strikerId;
  }

  /**
   * 3️⃣ Odd runs swap
   */
  if (!(isWicket && wicketType === "CAUGHT")) {
    if (runs % 2 === 1) {
      [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
    }
  }

  /**
   * 4️⃣ Over end swap
   */
  if (isLegalDelivery && ballNumber === 6) {
    [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
  }

  return { nextStriker, nextNonStriker };
};
