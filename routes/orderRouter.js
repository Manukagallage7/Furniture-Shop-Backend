import express from 'express';
import { createOrder, getOrders } from '../controllers/orderController.js';

const orderRouter = express.Router()

orderRouter.post("/create", createOrder)
orderRouter.get("/get", getOrders)

export default orderRouter