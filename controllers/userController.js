import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";
import axios from "axios";

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
        isBlocked: req.body.isBlocked,
        createdAt: Date.now(),
        address: req.body.address
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
                        address: user.address,
                        isEmailVerified: user.isEmailVerified,
                        role: user.role,
                        profilePicture: user.profilePicture,
                        createdAt: user.createdAt
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

export async function getUserByEmail(req, res) {
    const email = req.params.email

    try {
        const user = await UserModel.findOne({ email: email })
        if(user) {
            res.status(200).json({
                message: "User found",
                data: user
            })
        } else {
            res.status(404).json({
                message: "User not found"
            })
        }
    } catch(err) {
        res.status(500).json({
            message: "Error retrieving user",
            error: err.message
        })
    }
}

export async function updateUserByEmail(req, res) {
    if(req.user == null) {
        return res.status(401).json({
            message: "Please Login to Update Profile"
        })
    }

    const email = req.params.email
    const { phone, address } = req.body

    try {
        const user = await UserModel.findOne({ email: email })
        if(!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        if(req.user.role !== "admin" && user.email !== req.user.email) {
            return res.status(403).json({
                message: "You can only update your own profile"
            })
        }

        const updateData = {}
        if(phone !== undefined) updateData.phone = phone
        if(address !== undefined) updateData.address = address

        const updatedUser = await UserModel.findOneAndUpdate(
            { email: email },
            updateData,
            { new: true }
        )

        const { password, ...userWithoutPassword } = updatedUser.toObject()
        res.status(200).json({
            message: "User Updated Successfully",
            data: userWithoutPassword
        })
    } catch(err) {
        res.status(500).json({
            message: "Error updating user",
            error: err.message
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

export async function googleLogin(req, res) {
    const googleToken = req.body.token

    try {
        const response = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo`, {
            headers: {
                Authorization: `Bearer ${googleToken}`
            }
        })
        const user = await UserModel.findOne({ email: response.data.email })
        if(user) {
            const token = jwt.sign({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                isBlocked: user.isBlocked,
                isEmailVerified: user.isEmailVerified,
                role: user.role,
                profilePicture: user.profilePicture
            }, process.env.JWT_SECRET, { expiresIn: "7d" })
            res.status(200).json({
                message: "Login successful",
                token: token,
                role: user.role,
                data: user
            })
        } else {
            const newUser = new UserModel({
                firstName: response.data.given_name,
                lastName: response.data.family_name,
                email: response.data.email,
                password: response.data.given_name + response.data.sub,
                phone: null,
                role: "user",
                isEmailVerified: true,
                profilePicture: response.data.picture
            })
            const savedUser = await newUser.save()
            const token = jwt.sign({
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                email: savedUser.email,
                phone: savedUser.phone,
                isBlocked: savedUser.isBlocked,
                isEmailVerified: savedUser.isEmailVerified,
                role: savedUser.role,
                profilePicture: savedUser.profilePicture
            }, process.env.JWT_SECRET, { expiresIn: "7d" })
            res.status(201).json({
                message: "User created and logged in successfully",
                token: token,
                role: savedUser.role,
                data: savedUser
            })
        }
    } catch(err) {
        console.error("Error fetching user info from Google:", err.message)
        return res.status(500).json({
            message: "Error fetching user info from Google",
            error: err.message
        })
    }
    

}

export async function updateUser(req, res) {
    const userId = req.params.id
    const updateData = req.body

    if(req.user == null) {
        return res.status(401).json({
            message: "Please Login to Update User"
        })
    }
    try{
        if(req.user.role == "user") {
            const user = await UserModel.findById(userId)
            if(!user) {
                return res.status(404).json({
                    message: "User not found"
                })
            }
            if(user.email !== req.user.email) {
                return res.status(403).json({
                    message: "You can only update your own profile"
                })
            }
            const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true })
            res.status(200).json({
                message: "User Updated Successfully",
                data: updatedUser
            })
        } else if(req.user.role == "admin") {
            const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true })
            if(updatedUser) {
                res.status(200).json({
                    message: "User Updated Successfully",
                    data: updatedUser
                })
            } else {
                res.status(404).json({
                    message: "User not found"
                })
            }
        } else {
            return res.status(403).json({
                message: "Access Denied"
            })
        }
    }catch(err) {
        res.status(500).json({
            message: "Error updating user",
            error: err.message
        })
    }
}

export async function deleteUser(req, res) {
    const userId = req.params.id

    if(req.user == null) {
        return res.status(401).json({
            message: "Please Login to Delete User"
        })
    }
    try{
        if(req.user.role == "admin") {
            const deletedUser = await UserModel.findByIdAndDelete(userId)
            if(deletedUser) {
                res.status(200).json({
                    message: "User Deleted Successfully",
                    data: deletedUser
                })
            } else {
                res.status(404).json({
                    message: "User not found"
                })
            }
        } else {
            return res.status(403).json({
                message: "Access Denied"
            })
        }
    }catch(err) {
        res.status(500).json({
            message: "Error deleting user",
            error: err.message
        })
    }
}

export async function blockUser(req, res) {
    const userId = req.params.id

    if(req.user == null) {
        return res.status(401).json({
            message: "Please Login to Block User"
        })
    }
    try{
        if(req.user.role == "admin") {
            const blockedUser = await UserModel.findByIdAndUpdate(userId, { isBlocked: true }, { new: true })
            if(blockedUser) {
                res.status(200).json({
                    message: "User Blocked Successfully",
                    data: blockedUser
                })
            } else {
                res.status(404).json({
                    message: "User not found"
                })
            }
        } else {
            return res.status(403).json({
                message: "Access Denied"
            })
        }
    }catch(err) {
        res.status(500).json({
            message: "Error blocking user",
            error: err.message
        })
    }
}

export async function unblockUser(req, res) {
    const userId = req.params.id

    if(req.user == null) {
        return res.status(401).json({
            message: "Please Login to Unblock User"
        })
    }
    try{
        if(req.user.role == "admin") {
            const unblockedUser = await UserModel.findByIdAndUpdate(userId, { isBlocked: false }, { new: true })
            if(unblockedUser) {
                res.status(200).json({
                    message: "User Unblocked Successfully",
                    data: unblockedUser
                })
            } else {
                res.status(404).json({
                    message: "User not found"
                })
            }
        } else {
            return res.status(403).json({
                message: "Access Denied"
            })
        }
    }catch(err) {
        res.status(500).json({
            message: "Error unblocking user",
            error: err.message
        })
    }
}

export async function logOutUser(req, res) {
    if(req.user == null) {
        return res.status(401).json({
            message: "Please Login to Logout"
        })
    } else {
        res.status(200).json({
            message: "Logout successful"
        })
    }
}