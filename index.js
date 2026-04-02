import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express()

app.use(bodyParser.json())

app.use((req, res, next) => {
    const value = req.header("Authorization")
    if (typeof value === 'string' && value.length > 0) {
        const token = value.replace(/^Bearer\s+/i, "")
        if (!token) return next()
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err || !decoded) {
                return res.status(401).json({ message: "Unauthorized" })
            }
            req.user = decoded
            next()
        })
    } else {
        next()
    }
})

const connectionString = process.env.MDB_URI

mongoose.connect(connectionString).then(()=>{
    console.log("Database Connection Successfully")
}).catch((err)=>{
    console.log("Database Connection Failed", err)
})

app.use("/api/users", userRouter)
app.use("/api/products", productRouter)

app.listen(5000, ()=>{
    console.log("Server is running on port 5000")
})

