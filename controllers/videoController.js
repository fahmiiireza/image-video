const ai = require('../config/gemini');
const fetch = require('node-fetch');
const { saveAndDownloadVideo } = require('../utils/fileHelpers');

exports.generateVideo = async (req, res) => {
  try {
    const { base64Image, prompt, aspectRatio = '16:9' } = req.body;

    if (!base64Image || !prompt) {
      return res.status(400).json({ error: 'Missing base64Image or prompt' });
    }

    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt,
      image: {
        imageBytes: base64Image,
        mimeType: 'image/png',
      },
      config: {
        aspectRatio,
        numberOfVideos: 1,
        durationSeconds: 5,
        personGeneration: 'allow_adult',
        enhance_prompt: true,
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const videoUrl = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUrl) {
      return res.status(500).json({ error: 'Failed to get video URL' });
    }

    const finalUrl = `${videoUrl}&key=${process.env.GEMINI_API_KEY}`;
    await saveAndDownloadVideo(finalUrl, res);

  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({ error: error.message });
  }
};
