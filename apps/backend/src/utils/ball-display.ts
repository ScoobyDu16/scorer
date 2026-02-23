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
 * Format a single ball
 */
export const formatBallDisplay = (ball: BallDisplayInput): string => {
  // Wicket takes highest priority
  if (ball.isWicket) return "W";

  switch (ball.extraType) {
    case "WIDE": {
      // extraRuns includes base 1
      const additional = ball.extraRuns - 1;
      return additional > 0 ? `WD+${additional}` : "WD";
    }

    case "NO_BALL": {
      // Additional runs come from bat (runs)
      const additional = ball.runs;
      return additional > 0 ? `NB+${additional}` : "NB";
    }

    case "BYE":
      return `${ball.extraRuns}B`;

    case "LEG_BYE":
      return `${ball.extraRuns}LB`;

    default:
      // Normal delivery
      return String(ball.runs);
  }
};

/**
 * Format recent balls:
 * - Oldest on left
 * - Newest on right
 * - Add "|" after every completed over (6 legal balls)
 */
export const formatRecentBalls = (
  balls: BallDisplayInput[],
): { formatted: string[] } => {
  if (!balls || balls.length === 0) {
    return { formatted: [] };
  }

  // DB gives newest first → reverse
  const sorted = [...balls].reverse();

  const result: string[] = [];

  let currentOver = sorted[0].overNumber;
  let legalCount = 0;

  for (const ball of sorted) {
    // If over changed → separator
    if (ball.overNumber !== currentOver) {
      result.push("|");
      currentOver = ball.overNumber;
      legalCount = 0;
    }

    result.push(formatBallDisplay(ball));

    // Count only legal deliveries
    if (ball.isLegalDelivery) {
      legalCount++;

      // Over completed after 6 legal balls
      if (legalCount === 6) {
        // Only add separator if there are more balls in the next over
        const hasMoreBallsInNextOver = sorted.some(b => b.overNumber > currentOver);
        if (hasMoreBallsInNextOver) {
          result.push("|");
        }
        legalCount = 0;
      }
    }
  }

  // Remove trailing "|"
  if (result[result.length - 1] === "|") {
    result.pop();
  }

  return { formatted: result };
};
