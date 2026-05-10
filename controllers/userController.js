import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";

export function createUser(req, res){

    const passwordHash = bcrypt.hashSync(req.body.password, 10)

    const userData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: passwordHash,
        phone: req.body.phone,
        role: req.body.role,
        isEmailVerified: req.body.isEmailVerified,
        profilePicture: req.body.profilePicture,
        isBlocked: req.body.isBlocked
    }

    const user = new UserModel(userData)

    user.save()
        .then((data) => {
            res.status(201).json({
                message: "User created successfully",
                data: data
            })
        })
        .catch((err) => {
            res.status(500).json({
                message: "Error creating user",
                error: err.message
            })
        })
}

export function loginUser(req, res){

    const email = req.body.email
    const password = req.body.password

    UserModel.findOne({ email: email })
        .then((user) => {
            if(user == null){
                res.status(404).json({
                    message: "User not found"
                })
            } else {
                const isPasswordCorrect = bcrypt.compareSync(password, user.password)
                if(isPasswordCorrect){
                    const token = jwt.sign({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone,
                        isBlocked: user.isBlocked,
                        isEmailVerified: user.isEmailVerified,
                        role: user.role,
                        profilePicture: user.profilePicture
                    }, process.env.JWT_SECRET, { expiresIn: "7d"
                        
                    })
                    res.status(200).json({
                        message: "Login successful",
                        token: token,
                        role: user.role,
                        data: user
                    })
                } else {
                    res.status(401).json({
                        message: "Invalid Password"
                    })
                }
            }
        }).catch((err) => {
            res.status(500).json({
                message: "Error logging in",
                error: err.message
            })
        })
}

export function getUser(req, res) {
    if(req.user == null) {
        return res.status(404).json({
            message: "User not found"
        })
    }else {
        res.status(200).json({
            message: "User found",
            data: req.user
        })
    }
}

export async function getUsers(req, res) {
    const page = parseInt(req.params.page) || 1
    const limit = parseInt(req.params.limit) || 10

    if(req.user == null) {
        return res.status(401).json({
            message: "Please Login to View Users"
        })
    }
    try{
        if(req.user.role == "admin") {
            const usersCount = await UserModel.countDocuments()
            const totalPages = Math.ceil(usersCount / limit)
            const users = await UserModel.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
            res.status(200).json({
                message: "Users Retrieved Successfully",
                users: users,
                totalPages: totalPages
            })
        } else {
            return res.status(403).json({
                message: "Access Denied"
            })
        }
    } catch(err) {
        res.status(500).json({
            message: "Error retrieving users",
            error: err.message
        })
    }
}