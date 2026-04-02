import express from "express";
import { createProduct, updateProduct, deleteProduct, getProduct, getProductInfo } from "../controllers/productController.js";

const productRouter = express.Router()

productRouter.post("/create", createProduct)
productRouter.put("/update/:productId", updateProduct)
productRouter.delete("/delete/:productId", deleteProduct)
productRouter.get("/get", getProduct)
productRouter.get("/getInfo/:productId", getProductInfo)

export default productRouter;