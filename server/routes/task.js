const express   = require('express');
const { body, validationResult } = require('express-validator');
const Task      = require('../models/Tasks');
const { authentication } = require('../middleware/authentication');

const router = express.Router();

// check if the user is logged in 
router.use(authentication);

// retrive all tasks
router.get('/', async function(req, res, next) {
    try {
        // const tasks = await Task.findByUser(req.user._id);
        // res.json(tasks);
        res.json("Hellow world")

    } catch (error) {
        next(error);
    }
});

// retrive task by userid
router.get('/:id', async function(req, res, next) {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found.' });
        }

        res.json(task);

    } catch (error) {
        next(error);
    }
});

// create task
router.post('/', [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Priority must be high, medium, or low')
],
async function(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
        const { title, description, priority, category, dueDate } = req.body;

        const task = await Task.create({
            user:     req.user._id,
            title,
            description,
            priority,
            category,
            dueDate
        });

        res.status(201).json(task);

    } catch (error) {
        next(error);
    }
});

// update existing id
router.put('/:id', [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Invalid priority value')
],
async function(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
        // Only allow these specific fields to be updated
        const allowedFields = ['title', 'description', 'priority', 'category', 'completed', 'dueDate'];
        const updates = {};

        allowedFields.forEach(function(field) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        // Make sure we only update tasks that belong to this user
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!task) {
            return res.status(404).json({ error: 'Task not found.' });
        }

        res.json(task);

    } catch (error) {
        next(error);
    }
});

// delete task

router.delete('/:id', async function(req, res, next) {
    try {
        const task = await Task.findOneAndDelete({
            _id:  req.params.id,
            user: req.user._id
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found.' });
        }

        res.json({ message: 'Task deleted successfully.', id: req.params.id });

    } catch (error) {
        next(error);
    }
});

module.exports = router;