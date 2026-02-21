export function calculateScore(signals) {
  let score = 0;

  Object.values(signals).forEach(value => {
    if (typeof value === "number") {
      score += Math.abs(value);
    }
  });

  const normalized = Math.min(100, Math.round(score * 20));

  let riskLevel = "Low";
  if (normalized > 60) riskLevel = "High";
  else if (normalized > 30) riskLevel = "Medium";

  return {
    score: normalized,
    riskLevel
  };
}
