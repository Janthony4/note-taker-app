// const mongoose = require('mongoose');

// const noteSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true
//   },
//   content: {
//     type: String,
//     required: true
//   },
//   attachments: [{
//     filename: String,
//     path: String,
//     contentType: String,
//     size: Number
//   }],
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('Note', noteSchema);

const mongoose = require('mongoose');
const path = require('path');

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
    filename: { type: String, required: true },
    path: { type: String, required: true },
    contentType: { type: String, required: true },
    originalname: { type: String },
    size: { type: Number, min: 1 }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
noteSchema.index({ title: 'text', content: 'text' });
noteSchema.index({ createdAt: -1 });

// Virtual for attachment URLs
noteSchema.virtual('attachmentUrls').get(function() {
  const baseUrl = process.env.BASE_URL || '';
  return this.attachments.map(att => ({
    url: `${baseUrl}/uploads/${att.filename}`,
    ...att.toObject()
  }));
});

// Clean up files when note is deleted
noteSchema.pre('remove', async function(next) {
  try {
    const fs = require('fs').promises;
    
    await Promise.all(this.attachments.map(async att => {
      const filePath = path.join(__dirname, '..', att.path);
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch (err) {
        console.error(`Error deleting file ${filePath}:`, err);
      }
    }));
    next();
  } catch (err) {
    next(err);
  }
});

// Update timestamp on save
noteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Note', noteSchema);