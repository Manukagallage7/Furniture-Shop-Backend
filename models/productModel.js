import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    altNames: {
        type: [String],
        default: []
    },
    labelledPrice: {
        type: Number,
        required: true,
    },
    actualPrice: {
        type: Number,
        required: true,
    },
    images: {
        type: [String],
        default: []
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        default: "Furniture Collections"
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    brand: {
        type: String,
        required: true,
        default: "Furnitures"
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: { type: String, default: "cm" }
    },
    weight: {
        type: Number,
        default: 0
    },
    material: {
        type: String,
        default: "Wood"
    },
    color: {
        type: String,
        default: "Natural"
    }
})

const productModel = mongoose.model("Product", productSchema)

export default productModel;
