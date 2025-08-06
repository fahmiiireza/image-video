require('dotenv').config();
const crypto = require('crypto');


// === global const ===
const DEFAULT_TTL_SECONDS = 30; //change expiration


// === Presigned URL Generator for Worker ===
function generatePresignedWorkerUrl(key, secretKey, ttlSeconds = DEFAULT_TTL_SECONDS) {
    const expires = Math.floor(Date.now() / 1000) + ttlSeconds;

    const token = crypto
        .createHmac('sha256', secretKey)
        .update(key + expires)
        .digest('hex');

    return `https://file.kodekalabs.com/${key}?expires=${expires}&token=${token}`;
}

// === Express Handler ===
exports.generatePresignedDownloadUrl = async (req, res) => {
    try {
        const { key } = req.body;
        if (!key) return res.status(400).json({ error: 'Missing key' });

        const secretKey = process.env.CLOUDFLARE_SECRET_KEY;
        const presignedUrl = generatePresignedWorkerUrl(key, secretKey, DEFAULT_TTL_SECONDS);

        return res.status(200).json({
            downloadUrl: presignedUrl,
            expiresInSeconds: 30,
            key,
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
