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
	fileFilter: (req, file, cb) => {
		const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
		const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
		const mimetype = filetypes.test(file.mimetype);

		if (extname && mimetype) {
			return cb(null, true);
		} else {
			cb('Error: Only images and documents are allowed!');
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

app.get('/api/notes', async (req, res) => {
	try {
		const notes = await Note.find({});
		res.send(notes);
	} catch (error) {
		res.status(500).send(error);
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

app.put('/api/notes/:id', upload.array('attachments'), async (req, res) => {
	try {
		const { title, content } = req.body;
		const existingNote = await Note.findById(req.params.id);

		if (!existingNote) {
			return res.status(404).json({ message: 'Note not found' });
		}

		// Handle existing attachments
		let attachments = existingNote.attachments || [];

		// Add new attachments if any
		if (req.files && req.files.length) {
			const newAttachments = req.files.map(file => ({
				filename: file.filename,
				originalname: file.originalname,
				path: file.path,
				contentType: file.mimetype,
				size: file.size
			}));
			attachments = [...attachments, ...newAttachments];
		}

		const note = await Note.findByIdAndUpdate(
			req.params.id,
			{ title, content, attachments },
			{ new: true }
		);

		res.json(note);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

app.listen(port, () => {
	console.log(`Backend running on port ${port}`);
});