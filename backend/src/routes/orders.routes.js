const express = require("express");
const router = express.Router();

const { createOrder } = require("../controllers/orders.controller");

router.post("/create-order", createOrder);

module.exports = router;