import order from '../models/orderModel.js';

export async function createOrder(req, res) {
    if(req.user == null){
        return res.status(401).json({
            message: "Please Login to Create an Order"
        })
    }
    const latestOrder = await order.findOne().sort({ date: -1 }).limit(1)

    let orderId = "FRD000001"
    if(latestOrder != null){
        const latestOrderID = latestOrder.orderId
        const latestOrderIdWithoutPrefix = latestOrderID ? parseInt(latestOrderID.replace("FRD", ""), 10) : 0
        const newOrderIdWithoutPrefix = latestOrderIdWithoutPrefix + 1
        orderId = "FRD" + newOrderIdWithoutPrefix.toString().padStart(6, "0")
    }

    const newOrder = new order({
        orderId: orderId,
        email: req.user.email,
        name: req.user.firstName + " " + req.user.lastName,
        phone: req.body.phone,
        address: req.body.address,
        items: []
    })
    
    const result = await newOrder.save()

    res.status(201).json({
        message: "Order Created Successfully",
        order: result
    })
}