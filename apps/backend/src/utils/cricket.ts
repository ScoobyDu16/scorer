export const ballsToOvers = (balls: number): number => {
  const overs = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return Number((overs + remainingBalls / 10).toFixed(1));
};

export const ballsToOverBall = (balls: number) => ({
  over: Math.floor(balls / 6),
  ball: balls % 6,
});
