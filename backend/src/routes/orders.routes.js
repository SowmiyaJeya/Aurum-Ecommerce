const express = require("express");
const router = express.Router();
const { createOrder, handleOrderRequest,displayAllOrders,getOrderItems,updateOrderStatus} = require("../controllers/orders.controller");

router.post("/all-orders", displayAllOrders);
router.post("/orders-data", handleOrderRequest);
router.post("/create-order", createOrder);
router.post("/order-items", getOrderItems);
router.put("/update-status", updateOrderStatus);

module.exports = router;