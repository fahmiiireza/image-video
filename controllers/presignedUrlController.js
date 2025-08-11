require('dotenv').config();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// === global const ===
const WORKER_URL = "https://kodekalabs-worker.enricoarianthou.workers.dev";
const DEFAULT_TTL_SECONDS = 30; //change expiration
const CLOUDFLARE_SECRET_KEY = process.env.CLOUDFLARE_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !CLOUDFLARE_SECRET_KEY) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// === Presigned URL Generator for Worker ===
function generatePresignedWorkerUrl(key, secretKey, ttlSeconds = DEFAULT_TTL_SECONDS) {
    const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
    const token = crypto
        .createHmac('sha256', secretKey)
        .update(key + expires)
        .digest('hex');

    return { url: `${WORKER_URL}/${key}?expires=${expires}&token=${token}`, token, expires };
}

// === Express Handler ===
exports.generatePresignedDownloadUrl = async (req, res) => {
    try {
        const { key, max_downloads } = req.body;
        if (!key) return res.status(400).json({ error: 'Missing key' });

        const { url, token, expires } = generatePresignedWorkerUrl(key, CLOUDFLARE_SECRET_KEY, DEFAULT_TTL_SECONDS);
        const expiresAt = new Date(expires * 1000).toISOString();

        // Insert into Supabase for tracking
        const { error } = await supabase
            .from('presigned_tokens')
            .insert([{
                token,
                file_key: key,
                max_downloads: max_downloads ?? 3,
                downloads_used: 0,
                expires_at: expiresAt
            }]);

        if (error) {
            console.error('Supabase insert error:', error);
            return res.status(500).json({ error: 'Database insert failed', details: error });
        }

        return res.status(200).json({
            downloadUrl: url,
            token,
            expiresAt,
            expiresInSeconds: DEFAULT_TTL_SECONDS,
            file_key: key
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
