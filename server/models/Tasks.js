const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        // Links the task to the user who created it
        user: {
            type:     mongoose.Schema.Types.ObjectId,
            ref:      'User',
            required: true
        },
        title: {
            type:      String,
            required:  [true, 'Task title is required'],
            trim:      true,
            maxlength: 150
        },
        description: {
            type:      String,
            default:   '',
            maxlength: 500
        },
        priority: {
            type:    String,
            enum:    ['high', 'medium', 'low'],
            default: 'medium'
        },
        category: {
            type:    String,
            default: 'General',
            trim:    true
        },
        completed: {
            type:    Boolean,
            default: false
        },
        dueDate: {
            type:    Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// method to find task by user id
taskSchema.statics.findByUser = function(userId) {
    return this.find({ user: userId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Task', taskSchema);