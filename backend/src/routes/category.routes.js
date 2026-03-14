const express = require("express");
const router = express.Router();
const { categoryController,addCategoryController,updateCategoryController, deleteCategoryController,brandController} = require("../controllers/category.controller");

router.post("/categories",categoryController)
router.post("/add-category", addCategoryController);
router.put("/update-category",updateCategoryController)
router.delete("/delete-category",deleteCategoryController)

router.post("/displayBrands",brandController);

module.exports = router;