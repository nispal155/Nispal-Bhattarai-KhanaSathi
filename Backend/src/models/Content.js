const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
        enum: ['faq', 'terms', 'privacy', 'about', 'contact']
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
