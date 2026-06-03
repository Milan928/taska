// import required packages

require('dotenv').config()

const express = require('express')
const fs = require('fs')
const cors = require('cors')
const https = require('https')
const http = require('http')

// import modules of the project
const connectDB = require('./config/db')
const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/task')
const errorHandler = require('./middleware/errorHandler')

// connect to mongoDB 

connectDB();
const app = express();

// cors setup 
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',')

app.use(cors({
    origin: function(origin, callback) {

        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}));


// api routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/health', function(req, res){
    res.json({
        status: 'Ok',
        message: "The api is running",
        time: new Date()
    });
});

// Catch-all for unknown routes
app.use(function(req, res) {
    res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

// start point of server 
const PORT     = process.env.PORT || 3000;
const keyPath  = process.env.SSL_KEY_PATH  || './config/key.pem';
const certPath = process.env.SSL_CERT_PATH || './config/cert.pem';

const sslFilesExist = fs.existsSync(keyPath) && fs.existsSync(certPath);

if (sslFilesExist) {

    const sslOptions = {
        key:  fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };

    // Start HTTPS server
    https.createServer(sslOptions, app).listen(PORT, function() {
        console.log('HTTPS server running on https://localhost:' + PORT);
    });

} else {
    http.createServer(app).listen(PORT, function() {
        console.log('HTTP server running on http://localhost:' + PORT);
        console.log('(No cert files found - using HTTP)');
    });
}

module.exports = app;