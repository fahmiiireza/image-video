const express = require('express');
const router = express.Router();
const authorize = require('../middleware/authMiddleware');
const presignedUrlController = require("../controllers/presignedUrlController");

router.post('/download', authorize, presignedUrlController.generatePresignedDownloadUrl);

module.exports = router;
