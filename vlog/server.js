const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Low, JSONFile } = require('lowdb');
const { nanoid } = require('nanoid');

const app = express();
const PORT = 3000;

// Database setup
const adapter = new JSONFile('db.json');
const db = new Low(adapter);

app.use(cors());
app.use(bodyParser.json());

// Initialize database with default structure
async function initDB() {
  await db.read();
  db.data ||= { users: [], vlogs: [] };
  await db.write();
}
initDB();

// --- SIGNUP ---
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  await db.read();

  const exists = db.data.users.find(u => u.username === username);
  if (exists) return res.status(400).json({ message: 'Username already exists' });

  db.data.users.push({ id: nanoid(), username, email, password });
  await db.write();
  res.json({ message: 'Signup successful!' });
});

// --- LOGIN ---
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  await db.read();

  const user = db.data.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(400).json({ message: 'Invalid username or password' });

  res.json({ message: 'Login successful!' });
});

// --- UPLOAD VLOG ---
app.post('/upload', async (req, res) => {
  const { username, title, description, image } = req.body;
  await db.read();

  if (!username || !title || !description)
    return res.status(400).json({ message: 'Missing fields' });

  db.data.vlogs.push({
    id: nanoid(),
    username,
    title,
    description,
    image: image || ''
  });
  await db.write();
  res.json({ message: 'Vlog uploaded successfully!' });
});

// --- GET VLOGS ---
app.get('/vlogs', async (req, res) => {
  await db.read();
  res.json(db.data.vlogs);
});

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
