const express = require("express")
const router = express.Router()
const brandController = require("../controllers/brand.controller")

router.post("/addBrand", brandController.addBrandController)
router.post("/brands", brandController.brandController)
router.put("/updateBrand", brandController.updateBrandController);
router.delete("/deleteBrand", brandController.deleteBrandController);


module.exports = router