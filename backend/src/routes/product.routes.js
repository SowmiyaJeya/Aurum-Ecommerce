const express = require("express");
const router = express.Router();
const { addProductController } = require("../controllers/product.controller");

router.post("/add-product", addProductController);

module.exports = router;