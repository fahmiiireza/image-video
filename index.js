
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs');
const { Readable } = require('stream');
const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();


dotenv.config();

const app = express();
const port = process.env.PORT || 3123;

app.use(bodyParser.json({ limit: '25mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/generate-video', async (req, res) => {
  try {
    const { base64Image, prompt } = req.body;

    if (!base64Image || !prompt) {
      return res.status(400).json({ error: 'Missing base64Image or prompt' });
    }

    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      image: {
        imageBytes: base64Image,
        mimeType: 'image/png',
      },
      config: {
        aspectRatio: '16:9',
        numberOfVideos: 1,
        durationSeconds: 6,
        personGeneration: 'allow_adult',
        enhance_prompt: true
      }
    });

    // Polling until the operation is complete
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const videoUrl = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUrl) {
      return res.status(500).json({ error: 'Failed to get video URL' });
    }

    const finalUrl = `${videoUrl}&key=${process.env.GEMINI_API_KEY}`;
    const videoResp = await fetch(finalUrl);

    if (!videoResp.ok) {
      return res.status(500).json({ error: 'Failed to fetch video from Gemini' });
    }

    const tempPath = `video_${Date.now()}.mp4`;
    const writer = fs.createWriteStream(tempPath);
    videoResp.body.pipe(writer);

    writer.on('finish', () => {
      res.download(tempPath, () => fs.unlinkSync(tempPath));
    });

  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
