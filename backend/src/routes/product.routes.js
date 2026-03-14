const express = require("express");
const router = express.Router();
const { addProductController } = require("../controllers/product.controller");
const productController = require("../controllers/product.controller"); 
const upload = require("../middlewares/upload");

router.post( "/add-product",upload.array("images", 5), // max 5 images
  productController.addProductController
);
router.post("/list-categories",productController.categoryController)
router.put(
  "/update-product",
  upload.array("images", 5),
  productController.updateProductController
);
router.post( "/products",productController.getAllProductsController);   
router.delete("/delete-product", productController.deleteProductController);

module.exports = router;