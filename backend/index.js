const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const Note = require('./models/Note');

mongoose.connect(process.env.MONGO_URI)
	.then(() => console.log('Connected to MongoDB'))
	.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.post('/api/notes', async (req, res) => {
	try {
		const note = new Note(req.body);
		await note.save();
		res.status(201).send(note);
	} catch (error) {
		res.status(400).send(error);
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
		const note = await Note.findById(req.params.id)
		if (!note) return res.status(404).send('Note not found')
		res.json(note)
	} catch (err) {
		res.status(500).send('Server error')
	}
});


app.delete('/api/notes/:id', async (req, res) => {
	try {
		const note = await Note.findByIdAndDelete(req.params.id);
		if (!note) return res.status(404).send();
		res.send(note);
	} catch (error) {
		res.status(500).send(error);
	}
});

app.listen(port, () => {
	console.log(`Backend running on port ${port}`);
});
