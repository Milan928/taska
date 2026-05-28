const mongoose = require('mongoose')

// connect to mongoose data base
async function connectDB(){
    try{
        const connection = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Mongo DB connected successfully: '+ connection.connection.host);
    } catch (error){
        console.log('MongoDB connection error: '+ error.message);
        process.exit(1);
    }
}

module.exports = connectDB;