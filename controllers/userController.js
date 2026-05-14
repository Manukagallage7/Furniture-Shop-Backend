import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";
import OTPModel from "../models/otpModel.js";
import axios from "axios";
import nodemailer from "nodemailer";

function getTransporter() {
    return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
}

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

export async function sendOTP(req, res) {
    const email = req.body.email

    try {
        const user = await UserModel.findOne({ email: email })
        if(!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }
        const otp = Math.floor(111111 + Math.random() * 999999).toString()
        console.log(`OTP for ${email}: ${otp}`)
        // delete all OTPs for this email and persist the new OTP
        try {
            await OTPModel.deleteMany({ email: email })
            const newOTP = new OTPModel({
                email: email,
                otp: otp,
                createdAt: Date.now()
            })
            await newOTP.save()
        } catch(err) {
            console.error("Error saving OTP to database:", err.message)
            return res.status(500).json({
                message: "Error saving OTP",
                error: err.message
            })
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.warn("Email configuration missing: EMAIL_USER or EMAIL_PASSWORD is not set")
            return res.status(200).json({
                message: "OTP generated successfully. Email service is not configured.",
                otp: otp
            })
        }

        try {
            const transporter = getTransporter()
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Your OTP for Password Reset",
                text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`
            }
            await transporter.sendMail(mailOptions)
        } catch(err) {
            console.error("Error sending OTP email:", err.message)

            return res.status(500).json({
                message: "Error sending OTP email",
                error: err.message
            })
        }

        res.status(200).json({
            message: "OTP sent successfully",
            otp: otp
        })
    } catch(err) {
        res.status(500).json({
            message: "Error sending OTP",
            error: err.message
        })
    }
}

export async function verifyOTP(req, res) {
    const email = req.body.email
    const otp = req.body.otp

    try {
        const otpRecord = await OTPModel.findOne({ email: email, otp: otp })
        if(!otpRecord) {
            return res.status(400).json({
                message: "Invalid OTP"
            })
        } else {
            const otpAge = (Date.now() - otpRecord.createdAt) / 1000 / 60
            if(otpAge > 10) {
                await OTPModel.deleteOne({ _id: otpRecord._id })
                return res.status(400).json({
                    message: "OTP expired"
                })
            } else {
                await OTPModel.deleteOne({ _id: otpRecord._id })
                return res.status(200).json({
                    message: "OTP verified successfully"
                })
            }
        }
    } catch(err) {
        res.status(500).json({
            message: "Error verifying OTP",
            error: err.message
        })
    }
}

export async function resetPassword(req, res) {
    const email = req.body.email
    const newPassword = req.body.newPassword

    try {
        const user = await UserModel.findOne({ email: email })
        if(!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }
        const passwordHash = bcrypt.hashSync(newPassword, 10)
        user.password = passwordHash
        await user.save()
        res.status(200).json({
            message: "Password reset successfully"
        })
    } catch(err) {
        res.status(500).json({
            message: "Error resetting password",
            error: err.message
        })
    }
}