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

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.post('/notes', async (req, res) => {
  const note = new Note(req.body);
  try {
    await note.save();
    res.status(201).send(note);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get('/notes', async (req, res) => {
  try {
    const notes = await Note.find({});
    res.send(notes);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.put('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!note) {
      return res.status(404).send();
    }
    res.send(note);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.delete('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) {
      return res.status(404).send();
    }
    res.send(note);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
