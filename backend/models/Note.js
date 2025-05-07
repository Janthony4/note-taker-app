const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    attachments: [{
        fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
        filename: { type: String, required: true },
        originalname: { type: String },
        contentType: { type: String, required: true },
        size: { type: Number, min: 1 }
    }],
    labels: [{ type: String, trim: true }],
    isPinned: { type: Boolean, default: false },
    isFavourite: { type: Boolean, default: false },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// Indexes
noteSchema.index({ title: 'text', content: 'text', labels: 'text' });
noteSchema.index({ createdAt: -1 });
noteSchema.index({ isPinned: -1, createdAt: -1 });
noteSchema.index({ isFavourite: -1, createdAt: -1 });
noteSchema.index({ labels: 1 });
noteSchema.index({ attachments: 1 });

// Clean up files when note is deleted
noteSchema.pre('remove', async function(next) {
    try {
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db);
        await Promise.all(this.attachments.map(att => 
            bucket.delete(att.fileId)
        ));
        next();
    } catch (err) {
        next(err);
    }
});

noteSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Note', noteSchema);