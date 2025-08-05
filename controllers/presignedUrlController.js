require('dotenv').config();
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// === Cloudflare R2 Config ===
class S3Config {
    constructor() {
        this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        this.accessKey = process.env.CLOUDFLARE_ACCESS_KEY;
        this.secretKey = process.env.CLOUDFLARE_SECRET_KEY;
        this.endpoint = `https://${this.accountId}.r2.cloudflarestorage.com`;
    }
}

// === R2 Client Wrapper ===
class R2Client {
    constructor(config) {
        this.s3Client = new S3Client({
            endpoint: config.endpoint,
            credentials: {
                accessKeyId: config.accessKey,
                secretAccessKey: config.secretKey,
            },
            region: 'auto',
            forcePathStyle: true,
        });
    }

    async generatePresignedDownloadUrl(bucketName, objectKey, expiration = 900) {
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
        });
        return await getSignedUrl(this.s3Client, command, { expiresIn: expiration });
    }
}

// === Express Handlers ===
exports.generatePresignedDownloadUrl = async (req, res) => {
    try {
        const { key } = req.body;
        if (!key) return res.status(400).json({ error: 'Missing key' });

        const config = new S3Config();
        const r2Client = new R2Client(config);
        const bucketName = process.env.CLOUDFLARE_BUCKET_NAME;

        const signedUrl = await r2Client.generatePresignedDownloadUrl(bucketName, key);

        return res.status(200).json({
            downloadUrl: signedUrl,
            key: key
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
