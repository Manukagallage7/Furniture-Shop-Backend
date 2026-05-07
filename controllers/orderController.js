import order from '../models/orderModel.js';

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