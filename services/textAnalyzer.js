import Sentiment from "sentiment";

export function analyzeText(text) {
  const sentiment = new Sentiment();
  const result = sentiment.analyze(text);

  const urgencyWords = ["agora", "urgente", "só hoje", "última chance"];
  const fearWords = ["perder", "ameaça", "risco", "perigo"];

  const urgencyScore = urgencyWords.some(w => text.toLowerCase().includes(w)) ? 1 : 0;
  const fearScore = fearWords.some(w => text.toLowerCase().includes(w)) ? 1 : 0;

  return {
    sentimentScore: result.score,
    urgencyScore,
    fearScore,
    emotionalIntensity: Math.abs(result.score)
  };
}
