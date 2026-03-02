const express = require('express');
const router = express.Router();
const { login } = require("../controllers/auth.controller");
// const authController = require('../controllers/auth.controller');
require('dotenv').config();
const pool = require("../config/db");
const {connectTelegram, verifyOtpAndRegister} = require("../controllers/auth.controller");
// Step 1 - Generate telegram link
router.post("/connect-telegram", connectTelegram);
// Step 2 - Verify OTP and register
router.post("/verify-otp", verifyOtpAndRegister);


router.post("/login", login);
router.post('/cancel-pending', async (req, res) => {
  const { email } = req.body
  await pool.query('DELETE FROM users WHERE email = $1', [email])
  res.json({ message: 'Cancelled' })
})


module.exports = router;

module.exports = router;