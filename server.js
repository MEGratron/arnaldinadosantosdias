import express from "express";
import cors from "cors";
import multer from "multer";

import { analyzeText } from "./services/textAnalyzer.js";
import { analyzeAudio } from "./services/audioAnalyzer.js";
import { analyzeImage } from "./services/imageAnalyzer.js";
import { calculateScore } from "./services/scoringEngine.js";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.post("/analyze/text", async (req, res) => {
  const analysis = analyzeText(req.body.content);
  const score = calculateScore(analysis);
  res.json({ analysis, score });
});

app.post("/analyze/audio", upload.single("file"), async (req, res) => {
  const analysis = await analyzeAudio(req.file.path);
  const score = calculateScore(analysis);
  res.json({ analysis, score });
});

app.post("/analyze/image", upload.single("file"), async (req, res) => {
  const analysis = await analyzeImage(req.file.path);
  const score = calculateScore(analysis);
  res.json({ analysis, score });
});

app.listen(4000, () => console.log("DeepEye Engine running on port 4000"));
