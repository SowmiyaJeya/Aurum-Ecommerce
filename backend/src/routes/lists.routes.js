const express = require("express")
const router = express.Router()
const allController = require("../controllers/lists.controller")


router.post("/all-categories", allController.allCategoryController);
router.post("/all-products",allController.getProductsByCategoryController);
router.post("/searchProducts", allController.searchProductsController);
router.post("/filter-price", allController.filterByPriceController);
router.post("/filter-brand", allController.filterByBrandController);
router.post("/filter-category", allController.filterByCategoryController);

module.exports = router;