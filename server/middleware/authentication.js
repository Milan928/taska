// this middleware check if the user is logged in or not using the jwt web token 
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

async function authentication(req, res, next) {
    let token = null;

    // Check if the Authorization header has a Bearer token
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // If no token was found, reject the request
    if (!token) {
        return res.status(401).json({ error: 'Not authorised. Please log in.' });
    }

    try {
        // Verify the token using the secret from .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the full user object to the request (minus the password)
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ error: 'This user no longer exists.' });
        }

        next();

    } catch (error) {
        return res.status(401).json({ error: 'Token is invalid or has expired.' });
    }
}

module.exports = { authentication };