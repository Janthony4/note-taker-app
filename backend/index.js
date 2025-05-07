const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Access-Control-Allow-Credentials',
    'Access-Control-Allow-Origin'
  ],
  exposedHeaders: ['Content-Disposition']
}));

app.use(express.json());

const session = require('express-session');
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

function requireAuth(req, res, next) {
	if (!req.session.userId) {
	  return res.status(401).json({ error: 'Not authenticated' });
	}
	next();
}

const allowedMimes = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml',
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'text/plain',
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'text/markdown'
];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

app.use(express.urlencoded({ extended: true }));
const Note = require('./models/Note');

mongoose.connect(process.env.MONGO_URI)
	.then(() => console.log('Connected to MongoDB'))
	.catch(err => console.error('MongoDB connection error:', err));


// Routes
app.post('/api/notes', requireAuth, upload.array('attachments'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const bucket = new GridFSBucket(mongoose.connection.db);
        
        // Upload files to GridFS
        const attachmentPromises = req.files?.map(async file => {
            const uploadStream = bucket.openUploadStream(file.originalname);
            const readStream = Readable.from(file.buffer);
            await new Promise((resolve, reject) => {
                readStream.pipe(uploadStream)
                    .on('finish', resolve)
                    .on('error', reject);
            });

            return {
                fileId: uploadStream.id,
                filename: uploadStream.filename,
                originalname: file.originalname,
                contentType: file.mimetype,
                size: file.size
            };
        }) || [];

        const attachments = await Promise.all(attachmentPromises);

        const note = new Note({
            title,
            content,
            attachments,
            user: req.session.userId,
        });

        await note.save();
        res.status(201).json(note);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/files/:fileId', requireAuth, async (req, res) => {
    try {
        const bucket = new GridFSBucket(mongoose.connection.db);
        const file = await bucket.find({ _id: new mongoose.Types.ObjectId(req.params.fileId) }).next();
        
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.set('Content-Type', file.contentType);
        
        const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(req.params.fileId));
        
        downloadStream.on('error', () => {
            res.status(404).json({ error: 'File not found' });
        });

        downloadStream.pipe(res);
    } catch (error) {
        console.error('Error retrieving file:', error);
        res.status(500).json({ error: 'Error retrieving file' });
    }
});

app.get('/api/notes', requireAuth, async (req, res) => {
	try {
		const { q, label, sort } = req.query;
		let query = { user: req.session.userId };
		
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
		else if (sort === 'title-asc') sortOption = { title: 1 };
		else if (sort === 'title-desc') sortOption = { title: -1 };

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

app.patch('/api/notes/:id', requireAuth, async (req, res) => {
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


app.get('/api/notes/:id', requireAuth, async (req, res) => {
	try {
		const note = await Note.findById(req.params.id);
		if (!note) return res.status(404).send('Note not found');
		res.json(note);
	} catch (err) {
		res.status(500).send('Server error');
	}
});

app.delete('/api/notes/:id', requireAuth, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).send();

        if (note.attachments && note.attachments.length) {
            const bucket = new GridFSBucket(mongoose.connection.db);
            await Promise.all(note.attachments.map(attachment => 
                bucket.delete(new mongoose.Types.ObjectId(attachment.fileId))
            ));
        }

        await Note.findByIdAndDelete(req.params.id);
        res.send(note);
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).send(error);
    }
});

app.put('/api/notes/:id', requireAuth, upload.array('newAttachments'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const bucket = new GridFSBucket(mongoose.connection.db);

        const labels = req.body.labels ? JSON.parse(req.body.labels) : [];
        const existingAttachments = req.body.attachments ? JSON.parse(req.body.attachments) : [];
        const deletedAttachments = req.body.deletedAttachments ? JSON.parse(req.body.deletedAttachments) : [];

        if (deletedAttachments.length > 0) {
            await Promise.all(deletedAttachments.map(async (fileId) => {
                try {
                    await bucket.delete(new mongoose.Types.ObjectId(fileId));
                } catch (err) {
                    console.error(`Failed to delete file ${fileId}:`, err);
                }
            }));
        }

        const newAttachmentPromises = req.files?.map(async file => {
            const uploadStream = bucket.openUploadStream(file.originalname);
            const readStream = Readable.from(file.buffer);
            
            await new Promise((resolve, reject) => {
                readStream.pipe(uploadStream)
                    .on('finish', resolve)
                    .on('error', reject);
            });

            return {
                fileId: uploadStream.id,
                filename: uploadStream.filename,
                originalname: file.originalname,
                contentType: file.mimetype,
                size: file.size
            };
        }) || [];

        const newAttachments = await Promise.all(newAttachmentPromises);

        const updateData = {
            title,
            content,
            labels,
            attachments: [...existingAttachments, ...newAttachments]
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

app.delete('/api/notes/:id/attachments/:fileId', requireAuth, async (req, res) => {
    try {
        const { id, fileId } = req.params;
        const bucket = new GridFSBucket(mongoose.connection.db);

        // Delete file from GridFS
        await bucket.delete(new mongoose.Types.ObjectId(fileId));

        // Remove from note's attachments
        await Note.findByIdAndUpdate(
            id,
            { $pull: { attachments: { fileId: new mongoose.Types.ObjectId(fileId) } } },
            { new: true }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting attachment:', error);
        res.status(500).json({ error: 'Failed to delete attachment' });
    }
});

const User = require('./models/User');

// Register
app.post('/api/register', async (req, res) => {
	try {
	  const { username, password } = req.body;
	  
	  // Check if user already exists
	  const existingUser = await User.findOne({ username });
	  if (existingUser) {
		return res.status(400).json({ error: 'Username already exists' });
	  }
  
	  const user = new User({ username, password });
	  await user.save();
  
	  req.session.userId = user._id;
	  res.json({ userId: user._id });
	} catch (error) {
	  res.status(400).json({ error: error.message });
	}
  });
  
  app.post('/api/login', async (req, res) => {
	try {
	  const { username, password } = req.body;
	  
	  const user = await User.findOne({ username });
	  if (!user || user.password !== password) {
		return res.status(401).json({ error: 'Invalid username or password' });
	  }
  
	  req.session.userId = user._id;
	  res.json({ userId: user._id });
	} catch (error) {
	  res.status(400).json({ error: error.message });
	}
  });
  
  app.post('/api/logout', (req, res) => {
	req.session.destroy();
	res.json({ message: 'Logged out successfully' });
  });

app.listen(port, () => {
	console.log(`Backend running on port ${port}`);
});