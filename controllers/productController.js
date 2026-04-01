import ProductModel from '../models/productModel.js'

export async function createProduct(req, res) {
        const product = new ProductModel(req.body)
            try{
                const response = await product.save()
                res.status(201).json({
                    message: "Product created successfully",
                    product: response
                })
            } catch(err){
                res.status(500).json({
                    message: "Error creating product",
                    error: err.message
                })
            }
}