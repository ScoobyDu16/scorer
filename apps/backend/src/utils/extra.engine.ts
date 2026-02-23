type ExtraInput = {
  runs?: number; // runs entered by scorer
  isWide?: boolean;
  isNoBall?: boolean;
  isByes?: boolean;
  isLegByes?: boolean;
};

export const calculateExtras = (data: ExtraInput) => {
  const {
    runs = 0,
    isWide = false,
    isNoBall = false,
    isByes = false,
    isLegByes = false,
  } = data;

  /**
   * 1️⃣ Validate only one extra type
   */
  const extraFlags = [isWide, isNoBall, isByes, isLegByes].filter(Boolean);

  if (extraFlags.length > 1) {
    throw new Error(
      "Only one extra type allowed per ball (Wide / No-ball / Bye / Leg-bye)",
    );
  }

  let extraType: "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE" | null = null;
  let extraRuns = 0;
  let batRuns = runs;
  let isLegalDelivery = true;

  /**
   * 2️⃣ Wide
   * Wide + runs = 1 penalty + runs taken
   */
  if (isWide) {
    extraType = "WIDE";
    extraRuns = 1 + runs;
    batRuns = 0;
    isLegalDelivery = false;
  } else if (isNoBall) {
    /**
     * 3️⃣ No Ball
     * No-ball = 1 penalty
     * Runs from bat are valid
     */
    extraType = "NO_BALL";
    extraRuns = 1;
    batRuns = runs;
    isLegalDelivery = false;
  } else if (isByes) {
    /**
     * 4️⃣ Byes
     */
    extraType = "BYE";
    extraRuns = runs;
    batRuns = 0;
  } else if (isLegByes) {
    /**
     * 5️⃣ Leg Byes
     */
    extraType = "LEG_BYE";
    extraRuns = runs;
    batRuns = 0;
  } else {
    /**
     * 6️⃣ Normal delivery
     */
    batRuns = runs;
  }

  const totalRuns = batRuns + extraRuns;

  return {
    extraType,
    extraRuns,
    batRuns,
    totalRuns,
    isLegalDelivery,
  };
};
