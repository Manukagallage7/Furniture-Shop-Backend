import express from "express";
import { createProduct, updateProduct, deleteProduct, getProduct, getProductInfo,searchProducts, getProductsByCategory } from "../controllers/productController.js";

const productRouter = express.Router()

productRouter.post("/create", createProduct)
productRouter.put("/update/:productId", updateProduct)
productRouter.delete("/delete/:productId", deleteProduct)
productRouter.get("/get", getProduct)
productRouter.get("/get/:productId", getProductInfo)
productRouter.get("/search/:query", searchProducts)
productRouter.get("/category/:category", getProductsByCategory)

export default productRouter;