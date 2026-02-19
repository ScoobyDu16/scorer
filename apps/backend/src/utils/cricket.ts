export const ballsToOvers = (balls: number): number => {
  const overs = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return Number((overs + remainingBalls / 10).toFixed(1));
};

export const ballsToOverBall = (balls: number) => ({
  over: Math.floor(balls / 6),
  ball: balls % 6,
});

export const calculateRunRate = (runs: number, balls: number) => {
  if (!balls || balls === 0) return 0;
  return Number(((runs / balls) * 6).toFixed(2));
};
