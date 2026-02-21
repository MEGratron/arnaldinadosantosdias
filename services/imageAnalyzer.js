import Tesseract from "tesseract.js";
import { analyzeText } from "./textAnalyzer.js";

export async function analyzeImage(path) {
  const { data: { text } } = await Tesseract.recognize(path, "eng");
  return analyzeText(text);
}
