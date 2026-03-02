const pool = require("../config/db");

const createPendingUser = async (userData) => {
  const { fullname, username, email, password, mobile, token } = userData;

  await pool.query(
    `INSERT INTO users 
     (fullname, username, email, password, mobile, telegram_token, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
    [fullname, username, email, password, mobile, token]
  );
};
// Save Telegram Token
const saveTelegramToken = async (email, token) => {
  await pool.query(
    "UPDATE users SET telegram_token = $1 WHERE email = $2",
    [token, email]
  );
};

// Get User By Telegram Token
const getUserByTelegramToken = async (token) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE telegram_token = $1",
    [token]
  );
  return result.rows[0];
};

// Save Telegram Chat ID
const saveChatId = async (email, chatId) => {
  await pool.query(
    "UPDATE users SET telegram_chat_id = $1 WHERE email = $2",
    [chatId, email]
  );
};

// Create User (your existing function)
const createUser = async (userData) => {
  const { fullname, username, email, password, mobile } = userData;

  await pool.query(
    `INSERT INTO users (fullname, username, email, password, mobile)
     VALUES ($1, $2, $3, $4, $5)`,
    [fullname, username, email, password, mobile]
  );
};

module.exports = {
  createPendingUser,
  saveTelegramToken,
  getUserByTelegramToken,
  saveChatId,
  createUser
};
