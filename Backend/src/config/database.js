const mongoose = require("mongoose")



async function connectToDB() {
    if (!process.env.MONGO_URI) {
        console.error("CRITICAL ERROR: MONGO_URI environment variable is missing!")
        process.exit(1)
    }

    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to Database")
    }
    catch (err) {
        console.error("Database connection failed:", err)
        process.exit(1)
    }
}

module.exports = connectToDB