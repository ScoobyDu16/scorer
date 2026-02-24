import { 
  getMatchPlayersRepo, 
  getInningsByIdRepo 
} from "../match/match.repository";
import { getLastBallsRepo } from "../ball/balls.repository";
import { getPlayerByIdRepo } from "../player/player.repository";

export interface WicketValidationData {
  wicketType: string;
  dismissedPlayerId: string;
  newBatsmanId: string;
  fielderId?: string;
  runs?: number;
  isWide?: boolean;
  isNoBall?: boolean;
  isByes?: boolean;
  isLegByes?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Validates wicket scenario according to ICC rules
 */
export const validateWicketScenario = async (
  matchId: string,
  inningsId: string,
  data: WicketValidationData
): Promise<ValidationResult> => {
  const innings = await getInningsByIdRepo(inningsId);
  if (!innings) {
    return { isValid: false, error: "Innings not found" };
  }

  // Get current striker and non-striker
  const strikerId = innings.currentStrikerId || innings.openingStrikerId;
  const nonStrikerId = innings.currentNonStrikerId || innings.openingNonStrikerId;

  if (!strikerId || !nonStrikerId) {
    return { isValid: false, error: "Current batsmen not properly set" };
  }

  // 1️⃣ Validate dismissed player is either striker or non-striker
  if (data.dismissedPlayerId !== strikerId && data.dismissedPlayerId !== nonStrikerId) {
    return { 
      isValid: false, 
      error: "Dismissed player must be either current striker or non-striker" 
    };
  }

  // 2️⃣ Validate new batsman belongs to batting team and hasn't batted before
  const battingTeamPlayers = await getMatchPlayersRepo(matchId);
  const battingTeamPlayersList = battingTeamPlayers
    .filter(p => p.team === innings.battingTeam)
    .map(p => p.playerId);

  if (!battingTeamPlayersList.includes(data.newBatsmanId)) {
    return { 
      isValid: false, 
      error: "New batsman must belong to the batting team" 
    };
  }

  // Check if new batsman has already batted (by checking recent balls)
  const recentBalls = await getLastBallsRepo(inningsId, 300); // Check last 50 overs worth
  const hasBattedBefore = recentBalls.some((ball: any) => 
    ball.batsmanId === data.newBatsmanId || 
    ball.dismissedPlayerId === data.newBatsmanId
  );

  if (hasBattedBefore) {
    return { 
      isValid: false, 
      error: "New batsman has already batted in this innings" 
    };
  }

  // 3️⃣ Validate helper requirements based on wicket type
  const helperValidation = validateWicketHelper(data.wicketType, data.fielderId, strikerId, nonStrikerId);
  if (!helperValidation.isValid) {
    return helperValidation;
  }

  // 4️⃣ Validate runs with wickets according to ICC rules
  const runsValidation = validateRunWithWicket(data.wicketType, data.runs, data.isWide, data.isNoBall);
  if (!runsValidation.isValid) {
    return runsValidation;
  }

  return { isValid: true };
};

/**
 * Validates fielder/helper requirements based on wicket type
 */
const validateWicketHelper = (
  wicketType: string, 
  fielderId: string | undefined,
  strikerId: string,
  nonStrikerId: string
): ValidationResult => {
  switch (wicketType) {
    case "BOWLED":
    case "LBW":
    case "HIT_WICKET":
      // No helper required
      if (fielderId) {
        return { 
          isValid: false, 
          error: `${wicketType} wickets cannot have a fielder helper` 
        };
      }
      break;

    case "CAUGHT":
      // Fielder required (unless caught-and-bowled)
      if (!fielderId) {
        return { 
          isValid: false, 
          error: "Caught wickets require a fielder" 
        };
      }
      break;

    case "CAUGHT_AND_BOWLED":
      // No fielder required (bowler catches own delivery)
      if (fielderId) {
        return { 
          isValid: false, 
          error: "Caught and bowled wickets cannot have a fielder helper" 
        };
      }
      break;

    case "STUMPED":
      // Fielder must be wicketkeeper
      if (!fielderId) {
        return { 
          isValid: false, 
          error: "Stumped wickets require a wicketkeeper" 
        };
      }
      // TODO: Add wicketkeeper validation when we track player roles
      break;

    case "RUN_OUT":
      // Fielder required
      if (!fielderId) {
        return { 
          isValid: false, 
          error: "Run out wickets require a fielder" 
        };
      }
      // Bowler can assist in run out
      break;

    default:
      return { 
        isValid: false, 
        error: `Invalid wicket type: ${wicketType}` 
      };
  }

  return { isValid: true };
};

/**
 * Validates runs allowed with different wicket types
 */
const validateRunWithWicket = (
  wicketType: string,
  runs?: number,
  isWide?: boolean,
  isNoBall?: boolean
): ValidationResult => {
  const hasExtras = isWide || isNoBall;

  switch (wicketType) {
    case "BOWLED":
    case "LBW":
    case "STUMPED":
    case "HIT_WICKET":
      // No runs from bat allowed, only wides/no-balls
      if (runs && runs > 0 && !hasExtras) {
        return { 
          isValid: false, 
          error: `${wicketType} wickets cannot have runs from bat` 
        };
      }
      break;

    case "CAUGHT":
      // No runs allowed at all (ICC rule - crossing ignored)
      if (runs && runs > 0) {
        return { 
          isValid: false, 
          error: "Caught wickets cannot have runs (ICC rule - crossing ignored)" 
        };
      }
      break;

    case "CAUGHT_AND_BOWLED":
      // No runs allowed at all (same as caught)
      if (runs && runs > 0) {
        return { 
          isValid: false, 
          error: "Caught and bowled wickets cannot have runs" 
        };
      }
      break;

    case "RUN_OUT":
      // Runs may be allowed depending on completion
      // This will be handled in main service based on run completion
      break;
  }

  return { isValid: true };
};
