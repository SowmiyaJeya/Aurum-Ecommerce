const pool = require('../config/db');

async function saveOTP(email, otp) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
        `INSERT INTO otps (email, otp, expires_at)
         VALUES ($1, $2, $3)`,
        [email, otp, expiresAt]
    );
}

async function verifyOTP(email, otp) {
    const result = await pool.query(
        `SELECT * FROM otps
         WHERE email = $1 AND otp = $2
         AND expires_at > NOW()`,
        [email, otp]
    );

    return result.rows.length > 0;
}

module.exports = { saveOTP, verifyOTP };