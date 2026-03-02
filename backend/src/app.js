const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const checkTelegramUpdates = require("./services/telegramPolling");

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);



setInterval(() => {
  checkTelegramUpdates();
}, 5000); // check every 5 seconds

module.exports = app;