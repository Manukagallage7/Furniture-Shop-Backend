import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";

const app = express()

app.use(bodyParser.json())

const connectionString = "mongodb+srv://manukakavinda1110_db_user:Furniture123@cluster0.cdvzhzo.mongodb.net/?appName=Cluster0"

mongoose.connect(connectionString).then(()=>{
    console.log("Database Connction Successfully")
}).catch((err)=>{
    console.log("Database Connection Failed", err)
})

app.listen(5000, ()=>{
    console.log("Server is running on port 5000")
})

