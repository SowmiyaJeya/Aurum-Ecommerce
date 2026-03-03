const express = require('express');
const router = express.Router();
const { login } = require("../controllers/auth.controller");
require('dotenv').config();
const pool = require("../config/db");
const {connectTelegram, verifyOtpAndRegister} = require("../controllers/auth.controller");
const { handleUserActions,addUserController} = require("../controllers/auth.controller");

router.post("/connect-telegram", connectTelegram);
router.post("/verify-otp", verifyOtpAndRegister);
router.post("/login", login);
router.post("/users", handleUserActions);
router.post("/add-user", addUserController);



router.post('/cancel-pending', async (req, res) => {
  const { email } = req.body
  await pool.query('DELETE FROM users WHERE email = $1', [email])
  res.json({ message: 'Cancelled' })
})


module.exports = router;