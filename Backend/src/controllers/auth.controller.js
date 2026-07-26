const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

const isProduction = process.env.NODE_ENV === "production"

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000
}

const clearCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax"
}

/**
 * @name registerUserController
 * @description Register a new user.
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password"
            })
        }

        const isUserAlreadyExists = await userModel.findOne({
            $or: [{ username }, { email }]
        })

        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "Account already exists with this email address or username"
            })
        }

        const hash = await bcrypt.hash(password, 10)

        const user = await userModel.create({
            username,
            email,
            password: hash
        })

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        )

        res.cookie("token", token, cookieOptions)

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (error) {
        console.error("Register error:", error)

        return res.status(500).json({
            message: "Unable to register user"
        })
    }
}

/**
 * @name loginUserController
 * @description Login an existing user.
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide email and password"
            })
        }

        const user = await userModel.findOne({ email })

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        )

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        )

        res.cookie("token", token, cookieOptions)

        return res.status(200).json({
            message: "User logged in successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (error) {
        console.error("Login error:", error)

        return res.status(500).json({
            message: "Unable to log in"
        })
    }
}

/**
 * @name logoutUserController
 * @description Clear token cookie and blacklist the token.
 * @access Public
 */
async function logoutUserController(req, res) {
    try {
        let token = req.cookies.token
        if (!token && req.headers.authorization) {
            const parts = req.headers.authorization.split(" ")
            token = parts.length === 2 && parts[0] === "Bearer" ? parts[1] : req.headers.authorization
        }

        if (token) {
            await tokenBlacklistModel.create({ token })
        }

        res.clearCookie("token", clearCookieOptions)

        return res.status(200).json({
            message: "User logged out successfully"
        })
    } catch (error) {
        console.error("Logout error:", error)

        return res.status(500).json({
            message: "Unable to log out"
        })
    }
}

/**
 * @name getMeController
 * @description Get current logged-in user details.
 * @access Private
 */
async function getMeController(req, res) {
    try {
        const user = await userModel
            .findById(req.user.id)
            .select("-password")

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        return res.status(200).json({
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (error) {
        console.error("Get user error:", error)

        return res.status(500).json({
            message: "Unable to fetch user details"
        })
    }
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}