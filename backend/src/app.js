// const express = require('express');
// const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes')
const categoryRoutes = require('./routes/category.routes')
const checkTelegramUpdates = require("./services/telegramPolling");
const express = require("express");
const cors = require("cors");
const session = require("express-session");

const app = express();

// 🔥 CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// 🔥 SESSION
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
       maxAge: 1000 * 60 * 30, // 10 sec for testing
    },
  })
);
// Add this after your session middleware
app.get("/api/check-session", (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({ valid: true });
  }
  return res.status(401).json({ valid: false });
});
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use("/", authRoutes); 
app.use("/add-users",authRoutes)
app.use("/update-user",authRoutes)
app.use("delete-user",authRoutes)

app.use("/",productRoutes)

app.use("/", categoryRoutes);


setInterval(() => {
  checkTelegramUpdates();
}, 5000); 


module.exports = app;