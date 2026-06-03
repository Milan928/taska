
const dns = require('dns');
const mongoose = require('mongoose')

// setting default 
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

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