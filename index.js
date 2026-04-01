import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import userRouter from "./routes/userRoute.js";

dotenv.config();

const app = express()

app.use(bodyParser.json())

const connectionString = process.env.MDB_URI

mongoose.connect(connectionString).then(()=>{
    console.log("Database Connction Successfully")
}).catch((err)=>{
    console.log("Database Connection Failed", err)
})

app.use("/users", userRouter)

app.listen(5000, ()=>{
    console.log("Server is running on port 5000")
})

