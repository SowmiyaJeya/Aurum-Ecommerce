const express = require("express");
const router = express.Router();
const { categoryController,addCategoryController,updateCategoryController, deleteCategoryController} = require("../controllers/category.controller");

router.post("/categories",categoryController)
router.post("/add-category", addCategoryController);
router.put("/update-category",updateCategoryController)
router.delete("/delete-category",deleteCategoryController)

module.exports = router;