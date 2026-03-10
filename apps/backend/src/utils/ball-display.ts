// ball-display.ts

export type BallDisplayInput = {
  overNumber: number;
  runs: number;
  extraType: "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE" | null;
  extraRuns: number;
  isWicket: boolean;
  isLegalDelivery: boolean;
};

/**
 * Format a single ball event
 */
export const formatBallDisplay = (ball: BallDisplayInput): string => {
  if (ball.isWicket) return "W";

  switch (ball.extraType) {
    case "WIDE": {
      // extraRuns includes base wide run
      const additional = ball.extraRuns - 1;
      return additional > 0 ? `WD+${additional}` : "WD";
    }

    case "NO_BALL": {
      // NB always gives 1 run + bat runs
      const batRuns = ball.runs || 0;
      return batRuns > 0 ? `NB+${batRuns}` : "NB";
    }

    case "BYE":
      return `${ball.extraRuns}B`;

    case "LEG_BYE":
      return `${ball.extraRuns}LB`;

    default:
      return String(ball.runs);
  }
};

/**
 * Format recent balls
 *
 * Rules:
 * - Oldest → left
 * - Newest → right
 * - Max 12 balls
 * - "|" added only after 6 legal deliveries
 */
export const formatRecentBalls = (
  balls: BallDisplayInput[],
): { formatted: string[] } => {
  if (!balls || balls.length === 0) {
    return { formatted: [] };
  }

  // DB returns newest first → reverse
  const chronological = [...balls].reverse();

  // Limit to last 12 balls (production rule)
  const limited = chronological.slice(-12);

  const formatted: string[] = [];

  let legalCounter = 0;

  for (let i = 0; i < limited.length; i++) {
    const ball = limited[i];

    formatted.push(formatBallDisplay(ball));

    if (ball.isLegalDelivery) {
      legalCounter++;
    }

    const nextBall = limited[i + 1];

    /**
     * Insert over separator only when:
     * - 6 legal deliveries completed
     * - next ball exists
     */
    if (legalCounter === 6 && nextBall) {
      formatted.push("|");
      legalCounter = 0;
    }
  }

  return { formatted };
};
