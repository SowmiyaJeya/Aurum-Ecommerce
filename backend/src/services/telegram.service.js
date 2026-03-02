const axios = require('axios');
require('dotenv').config();

async function sendOTP(chatId, otp) {
    const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;

    await axios.post(url, {
        chat_id: chatId,
        text: `🔐 Your OTP is: ${otp}\nValid for 5 minutes.`
    });
}
const pool = require("../config/db");

exports.saveTelegramToken = async (email, token) => {
  await pool.query(
    "UPDATE users SET telegram_token = $1 WHERE email = $2",
    [token, email]
  );
};

exports.getUserByTelegramToken = async (token) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE telegram_token = $1",
    [token]
  );
  return result.rows[0];
};

exports.saveChatId = async (email, chatId) => {
  await pool.query(
    "UPDATE users SET telegram_chat_id = $1 WHERE email = $2",
    [chatId, email]
  );
};

module.exports = { sendOTP };