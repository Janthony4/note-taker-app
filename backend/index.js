const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configure multer storage
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const uploadDir = 'uploads/';
		// Create uploads directory if it doesn't exist
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir);
		}
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + path.extname(file.originalname));
	}
});

const upload = multer({

	storage,
	limits: {
		fileSize: 5 * 1024 * 1024 // 5MB limit per file
	},

	allowedMimes : [
		'image/jpeg',
		'image/png',
		'image/gif',
		'image/webp',
		'image/svg+xml',
		'application/pdf',
		'application/msword', // .doc
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
		'text/plain',
		'application/vnd.ms-powerpoint', // .ppt
		'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx ✅
		'application/vnd.ms-excel', // .xls
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
		'text/markdown' // .md
	],
	

	fileFilter : (req, file, cb) => {
		const filetypes = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|txt|ppt|pptx|xls|xlsx|md/;
		const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
		const mimetype = allowedMimes.includes(file.mimetype);

		if (extname && mimetype) {
			cb(null, true);
		} else {
			cb(new Error('Only supported file types are allowed'));
		}
	}

});

// Update CORS configuration to allow file uploads
app.use(cors({
	origin: 'http://localhost:5173', // Your frontend URL
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add this before your routes
app.use(express.urlencoded({ extended: true }));
const Note = require('./models/Note');

mongoose.connect(process.env.MONGO_URI)
	.then(() => console.log('Connected to MongoDB'))
	.catch(err => console.error('MongoDB connection error:', err));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.post('/api/notes', upload.array('attachments'), async (req, res) => {
	try {
		const { title, content } = req.body;
		const attachments = req.files?.map(file => ({
			filename: file.filename,
			originalname: file.originalname,
			path: file.path,
			contentType: file.mimetype,
			size: file.size
		})) || [];

		const note = new Note({
			title,
			content,
			attachments
		});

		await note.save();
		res.status(201).json(note);
	} catch (error) {
		console.error('Error creating note:', error);
		res.status(400).json({ error: error.message });
	}
});

// In your backend (index.js or routes file)
app.get('/api/notes', async (req, res) => {
	try {
		const { q, label, sort } = req.query;

		let query = {};
		if (q) {
			query.$or = [
				{ title: { $regex: q, $options: 'i' } },
				{ content: { $regex: q, $options: 'i' } }
			];
		}

		if (label) {
			query.labels = label;
		}

		let sortOption = { createdAt: -1 };
		if (sort === 'pinned') sortOption = { isPinned: -1, createdAt: -1 };
		else if (sort === 'favourite') sortOption = { isFavourite: -1, createdAt: -1 };
		else if (sort === 'title-asc') sortOption = { title: 1 }; // Add these
		else if (sort === 'title-desc') sortOption = { title: -1 }; // Add these

		const notes = await Note.find(query).sort(sortOption);
		const availableLabels = await Note.distinct('labels');

		res.json({
			notes,
			availableLabels
		});

	} catch (error) {
		console.error('Error fetching notes:', error);
		res.status(500).json({ error: 'Failed to fetch notes' });
	}
});

app.patch('/api/notes/:id', async (req, res) => {
	try {
		const { isPinned, isFavourite } = req.body;

		const updateFields = {};
		if (typeof isPinned === 'boolean') updateFields.isPinned = isPinned;
		if (typeof isFavourite === 'boolean') updateFields.isFavourite = isFavourite;

		const note = await Note.findByIdAndUpdate(
			req.params.id,
			{ $set: updateFields },
			{ new: true }
		);

		res.json(note);
	} catch (error) {
		console.error('Error updating pin/favourite:', error);
		res.status(500).json({ message: 'Failed to update note.' });
	}
});


app.get('/api/notes/:id', async (req, res) => {
	try {
		const note = await Note.findById(req.params.id);
		if (!note) return res.status(404).send('Note not found');
		res.json(note);
	} catch (err) {
		res.status(500).send('Server error');
	}
});

app.delete('/api/notes/:id', async (req, res) => {
	try {
		const note = await Note.findById(req.params.id);
		if (!note) return res.status(404).send();

		// Delete associated files
		if (note.attachments && note.attachments.length) {
			note.attachments.forEach(attachment => {
				if (fs.existsSync(attachment.path)) {
					fs.unlinkSync(attachment.path);
				}
			});
		}

		await Note.findByIdAndDelete(req.params.id);
		res.send(note);
	} catch (error) {
		res.status(500).send(error);
	}
});

// In your index.js
app.put('/api/notes/:id', upload.array('newAttachments'), async (req, res) => {
	try {
		const { id } = req.params;
		const { title, content } = req.body;

		// Parse the JSON strings from form data
		const labels = req.body.labels ? JSON.parse(req.body.labels) : [];
		const attachments = req.body.attachments ? JSON.parse(req.body.attachments) : [];

		// Process new attachments
		const newAttachments = req.files?.map(file => ({
			filename: file.filename,
			originalname: file.originalname,
			path: file.path,
			contentType: file.mimetype,
			size: file.size
		})) || [];

		// Combine all data
		const updateData = {
			title,
			content,
			labels,
			attachments: [...attachments, ...newAttachments]
		};

		const note = await Note.findByIdAndUpdate(id, updateData, { new: true });
		res.json(note);
	} catch (error) {
		console.error('Error updating note:', error);
		res.status(500).json({
			error: 'Failed to update note',
			details: error.message
		});
	}
});

app.delete('/api/notes/:id/attachments/:filename', async (req, res) => {
	try {
		const { id, filename } = req.params;

		// Remove file from filesystem
		const filePath = path.join(__dirname, 'uploads', filename);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}

		// Remove from note's attachments
		await Note.findByIdAndUpdate(
			id,
			{ $pull: { attachments: { filename } } },
			{ new: true }
		);

		res.json({ success: true });
	} catch (error) {
		console.error('Error deleting attachment:', error);
		res.status(500).json({ error: 'Failed to delete attachment' });
	}
});
app.get('/api/notes/labels', async (req, res) => {
	try {
		// Use distinct to get all unique labels
		const labels = await Note.distinct('labels');
		// Filter out empty/null labels and sort alphabetically
		const filteredLabels = labels
			.filter(label => label && label.trim())
			.sort((a, b) => a.localeCompare(b));
		res.json(filteredLabels);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});
app.listen(port, () => {
	console.log(`Backend running on port ${port}`);
});