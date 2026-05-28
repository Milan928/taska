const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const User = require('../models/user');
const { authentication } = require('../middleware/authentication');

const router = express.Router();

console.log(process.env.JWT_SECRET);

// create JWT token
function createToken(userId) {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || '7d' }
    );
}

// register user
router.post(
    '/signup',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters')
    ],
    async function(req, res, next) {
        console.log('line 30');

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array()[0].msg
            });
        }
          console.log('line 39');

        try {
            const { name, email, password } = req.body;
             console.log(name);
              console.log(email);
              console.log(password);

            const user = await User.create({
                name,
                email,
                password
            });
             console.log('user created');

            const token = createToken(user._id);
            console.log(token);

            res.status(201).json({
                token,
                user
            });

        } catch (error) {
             console.log('catch error');
            next(error);
        }
    }
);

// login user
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async function(req, res, next) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: errors.array()[0].msg
            });
        }

        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });

            if (!user || !(await user.matchPassword(password))) {
                return res.status(401).json({
                    error: 'Invalid email or password.'
                });
            }

            const token = createToken(user._id);

            res.json({
                token,
                user
            });

        } catch (error) {
            next(error);
        }
    }
);

// current user
router.get('/me', authentication, function(req, res) {
    res.json({ user: req.user });
});

// logout
router.post('/logout', authentication, function(req, res) {
    res.json({
        message: 'Logged out successfully.'
    });
});

module.exports = router;