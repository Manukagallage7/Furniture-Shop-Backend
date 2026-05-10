import express from 'express';
import { createOrder, getOrders, updateOrder, getOrderById  } from '../controllers/orderController.js';

const orderRouter = express.Router()

orderRouter.post("/create", createOrder)
orderRouter.get("/get/:page/:limit", getOrders)
orderRouter.get("/get/:orderId", getOrderById)
orderRouter.put("/update/:orderId", updateOrder)

export default orderRouter