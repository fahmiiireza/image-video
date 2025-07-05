const fs = require('fs');
const fetch = require('node-fetch');

exports.saveAndDownloadVideo = async (videoUrl, res) => {
  const videoResp = await fetch(videoUrl);

  if (!videoResp.ok) {
    throw new Error('Failed to fetch video from Gemini');
  }

  const tempPath = `video_${Date.now()}.mp4`;
  const writer = fs.createWriteStream(tempPath);

  videoResp.body.pipe(writer);

  writer.on('finish', () => {
    res.download(tempPath, () => fs.unlinkSync(tempPath));
  });
};
