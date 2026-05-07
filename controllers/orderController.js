import order from '../models/orderModel.js';
import Product from '../models/productModel.js';

export async function createOrder(req, res) {
    if(req.user == null){
        return res.status(401).json({
            message: "Please Login to Create an Order"
        })
    }
    try{
        const latestOrder = await order.findOne().sort({ date: -1 }).limit(1)

        let orderId = "FRD000001"
        if(latestOrder != null){
            const latestOrderID = latestOrder.orderId
            const latestOrderIdWithoutPrefix = latestOrderID ? parseInt(latestOrderID.replace("FRD", ""), 10) : 0
            const newOrderIdWithoutPrefix = latestOrderIdWithoutPrefix + 1
            orderId = "FRD" + newOrderIdWithoutPrefix.toString().padStart(6, "0")
        }
        const items = []
        let total = 0

        if(req.body.items !== null && Array.isArray(req.body.items)){
            for(let i = 0; i < req.body.items.length; i++){
                let item = req.body.items[i]

                let product = await Product.findOne({
                    productId : item.productId
                })
                if(!product){
                    return res.status(404).json({
                        message: "Product not found."
                    })
                }
                items.push({
                    productId: item.productId,
                    name: product.name,
                    quantity: item.quantity,
                    actualPrice: product.actualPrice,
                    images: product.images[0],
                })
                total += product.actualPrice * item.quantity
            }
        }else {
            return res.status(400).json({
                message: "Invalid Items Format."
            })
        }

        const newOrder = new order({
            orderId: orderId,
            email: req.user.email,
            name: req.user.firstName + " " + req.user.lastName,
            phone: req.body.phone,
            address: req.body.address,
            items: items,
            total: total
        })
        
        const result = await newOrder.save()

        res.status(201).json({
            message: "Order Created Successfully",
            order: result
        })
    }catch(error){
        res.status(500).json({
            message: "Error Creating Order",
            error: error.message
        })
    }
}

export async function getOrders(req, res) {
    if(req.user == null){
        return res.status(401).json({
            message: "Please Login to View Orders"
        })
    }
    try {
        if(req.user.role == "admin") {
            const orders = await order.find().sort({ date: -1 })
            res.status(200).json({
                message: "Orders Retrieved Successfully",
                orders: orders
            })
        }
        else {
            const orders = await order.find({ email: req.user.email }).sort({ date: -1 })
            res.status(200).json({
                message: "Orders Retrieved Successfully",
                orders: orders
            })
        }
    } catch(error){
        res.status(500).json({
            message: "Error Retrieving Orders",
            error: error.message
        })
    }
}