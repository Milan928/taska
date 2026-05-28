// this middleware will acts as a central error handler

function errorHandler(err, req, res, next) {
    console.error('[Error] ' + req.method + ' ' + req.originalUrl);
    console.error(err.message);

    // Mongoose validation error (e.g. required field missing)
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(function(e) {
            return e.message;
        });
        return res.status(400).json({ error: messages.join(', ') });
    }

    // Duplicate key error (e.g. email already registered)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({ error: field + ' is already in use.' });
    }

    // Invalid MongoDB ID format
    if (err.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid ID format.' });
    }

    // Generic fallback
    res.status(err.statusCode || 500).json({
        error: err.message || 'Something went wrong on the server.'
    });
}

module.exports = errorHandler;