const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
    {
        name: {
            type:     String,
            required: [true, 'Name is required'],
            trim:     true
        },
        email: {
            type:      String,
            required:  [true, 'Email is required'],
            unique:    true,
            lowercase: true,
            trim:      true
        },
        password: {
            type:      String,
            required:  [true, 'Password is required'],
            minlength: 6
        }
    },
    {
        // Automatically adds createdAt and updatedAt fields
        timestamps: true
    }
);

// bcrypt the password before saving

userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 12);
});

// encrypt the password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

// avoid sending the password filed to json object of user
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);