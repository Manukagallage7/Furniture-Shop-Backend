import ProductModel from '../models/productModel.js'

export async function createProduct(req, res) {
    if(req.user == null){
        return res.status(401).json({
            message: "Please login to create a product"
        })
    }
    if(req.user.role !== 'admin'){
        return res.status(403).json({
            message: "You do not have permission to create a product"
        })
    }
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

export async function updateProduct(req, res) {
    if(req.user == null) {
        return res.status(401).json({
            message: "Please Login to update a product"
        })
    }
    if(req.user.role !== 'admin') {
        return res.status(403).json({
            message: "You do not have permission to update a product"
        })
    }
        try {
            const response = await ProductModel.findOneAndUpdate({ productId: req.params.productId }, req.body, { returnDocument: 'after' })
            res.status(200).json({
                message: "Product updated successfully",
                product: response
            })
        } catch (err) {
            res.status(500).json({
                message: "Error updating product",
                error: err.message
            })
        }
    }

export async function deleteProduct(req, res){
    if(req.user == null){
        return res.status(401).json({
            message: "Please login to delete a product"
        })
    }
    if(req.user.role !== 'admin'){
        return res.status(403).json({
            message: "You do not have permission to delete a product"
        })
    }
    try{
        const response = await ProductModel.findOneAndDelete({ productId: req.params.productId })
        res.status(200).json({
                message: "Product deleted successfully",
                product: response
            })
        } catch (err) {
            res.status(500).json({
                message: "Error deleting product",
                error: err.message
            })
        }
}

export async function getProduct(req, res){
    if(req.user == null){
        return res.status(401).json({
            message: "Please login to view products"
        })
    }
    try{
        if(req.user.role == "admin"){
            const response = await ProductModel.find()
            res.status(200).json({
                message: "Product retrieved successfully",
                product: response
            })
        } else {
            const response = await ProductModel.find({isAvailable: true})
            res.status(200).json({
                message: "Product retrieved successfully",
                product: response
            })
        }
    } catch (err) {
        res.status(500).json({
            message: "Error retrieving product",
            error: err.message
        })
    }
}

export async function getProductInfo(req, res){
    try{
        const product = await ProductModel.findOne({ productId: req.params.productId })
        if(product == null) {
            return res.status(404).json({
                message: "Product not found"
            })
        }
        if(req.user.role == "admin"){
            res.status(200).json({
                message: "Product retrieved successfully",
                product: product
            })
        } else {
            if(product.isAvailable) {
                res.status(200).json({
                    message: "Product retrieved successfully",
                    product: product
                })
            } else {
                res.status(403).json({
                    message: "You do not have permission to view this product"
                })
            }
        }
    }catch (err) {
        res.status(500).json({
            message: "Error retrieving product",
            error: err.message
        })
    }
}