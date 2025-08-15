const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
//TODO: is it cors needed?
const cors = require('cors');
const videoRoutes = require('./routes/videoRoutes');
const presignedUrlRoutes = require('./routes/presignedUrlRoutes');
const paymentRoutes = require('./routes/paymentsRoutes');
const shortenerRoutes = require('./routes/shortenerRoutes');


dotenv.config();

const app = express();
//TODO: is it cors needed?
app.use(cors());
const port = process.env.PORT || 3123;

// Global test/health-check route
app.get('/test', (req, res) => {
  res.send('Hello Kodeka Labs');
});
app.use(bodyParser.json({ limit: '25mb' }));

// Routes
app.use('/videos', videoRoutes);
app.use('/payments', paymentRoutes);
app.use('/presignedUrl', presignedUrlRoutes);
app.use('/shortener', shortenerRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
