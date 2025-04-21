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
	}
});


// Indexes
noteSchema.index({ title: 'text', content: 'text', labels: 'text' }); // Include labels
noteSchema.index({ createdAt: -1 });
noteSchema.index({ isPinned: -1, createdAt: -1 }); // To sort pinned first
noteSchema.index({ isFavourite: -1, createdAt: -1 }); // To sort favourites first
noteSchema.index({ labels: 1 }); // For label filtering
noteSchema.index({ attachments: 1 }); // For attachment filtering

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