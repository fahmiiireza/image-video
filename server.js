const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const videoRoutes = require('./routes/videoRoutes');

dotenv.config();

const app = express();
const port = process.env.PORT || 3123;

// Global test/health-check route
app.get('/test', (req, res) => {
  res.send('Hello Kodeka Labs');
});
app.use(bodyParser.json({ limit: '25mb' }));

// Routes
app.use('/videos', videoRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
