const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orders.controller");


router.post("/create-order", orderController.createOrder);

module.exports = router;