const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const session = require("express-session");
require("dotenv").config();
const { verifyGoogleToken, createOrGetUser, generateSessionData } = require("./middleware/googleAuth");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret_key_change_in_production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, 
      httpOnly: true,x,
      maxAge: 24 * 60 * 60 * 1000 
    }
  }) 
);
app.use(express.static(path.join(__dirname, "public"))); // <-- put your index.html inside "public" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // for uploaded images
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("data.json")) {
  fs.writeFileSync("data.json", JSON.stringify({ users: [], vlogs: [] }, null, 2));}
const readData = () => JSON.parse(fs.readFileSync("data.json", "utf8"));
const writeData = (data) => fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });
app.post("/signup", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ success: false, message: "All fields are required." });
  const data = readData();
  if (data.users.find(u => u.email === email))
    return res.json({ success: false, message: "User already exists!" });
  const newUser = { id: Date.now().toString(), username, email, password };
  data.users.push(newUser);
  writeData(data);
  res.json({ success: true, message: "Signup successful!" });
});
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.json({ success: false, message: "Email and password are required!" });
  const data = readData();
  const user = data.users.find(u => u.email === email && u.password === password);
  if (user)
    res.json({ success: true, username: user.username, message: "Login successful!" });
  else
    res.json({ success: false, message: "Invalid email or password." });
});
app.post("/upload", upload.single("image"), (req, res) => {
  const { username, title, description, content } = req.body;
  if (!username || !title || !description || !req.file)
    return res.json({ success: false, message: "All fields including image are required!" });

  const data = readData();
  const userObj = data.users.find(u => u.username === username || u.email === username);
  const authorId = userObj ? (userObj.id || userObj.email || userObj.username) : (req.body.authorId || null);
  const newVlog = {
    id: Date.now().toString(),
    username,
    authorId,
    title,
    description,
    content: content || description,
    image: `/uploads/${req.file.filename}`,
    date: new Date().toLocaleString(),
    timestamp: Date.now()
  };
  data.vlogs.push(newVlog);
  writeData(data);
  res.json({ success: true, message: "Vlog uploaded successfully!" });
});
app.get("/vlogs", (req, res) => {
  const data = readData();
  res.json(data.vlogs);
});
app.get("/uservlogs/:username", (req, res) => {
  const db = readData();
  const user = db.users.find(u => u.username === req.params.username || u.email === req.params.username);
  const userId = user ? user.id : null;
  const userVlogs = db.vlogs.filter(v => (v.authorId && userId && v.authorId === userId) || v.username === req.params.username);
  res.json(userVlogs);
});
app.delete("/vlogs/:id/:username", (req, res) => {
  const { id, username } = req.params;
  const db = readData();
  const user = db.users.find(u => u.username === username || u.email === username);
  const userId = user ? user.id : null;
  const vlogIndex = db.vlogs.findIndex(v => v.id === id && (
    v.username === username ||
    (v.authorId && userId && v.authorId === userId) ||
    (v.authorId && v.authorId === username)
  ));
  if (vlogIndex === -1)
    return res.status(403).json({ message: "You can delete only your own vlogs." });
  db.vlogs.splice(vlogIndex, 1);
  writeData(db);
  res.json({ message: "Vlog deleted successfully!" });
});
app.put('/vlogs/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { username, title, description, content } = req.body;
  const db = readData();
  const user = db.users.find(u => u.username === username || u.email === username);
  const userId = user ? user.id : null;
  const vlog = db.vlogs.find(v => v.id === id);
  if (!vlog) return res.status(404).json({ success: false, message: 'Vlog not found' });
  const isAuthor = vlog.username === username || (vlog.authorId && userId && vlog.authorId === userId) || (vlog.authorId && vlog.authorId === username);
  if (!isAuthor) return res.status(403).json({ success: false, message: 'You can edit only your own vlogs.' });
  if (title) vlog.title = title;
  if (description) vlog.description = description;
  if (content) vlog.content = content;
  if (req.file) vlog.image = `/uploads/${req.file.filename}`;
  vlog.date = new Date().toLocaleString();
  writeData(db);
  res.json({ success: true, message: 'Vlog updated successfully', vlog });
});
app.post("/auth/google", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.json({ success: false, message: "Token is required" });
  }
  const tokenData = await verifyGoogleToken(token);
  if (!tokenData.verified) {
    return res.json({ success: false, message: "Invalid token", error: tokenData.error });
  }
  try {
    const user = createOrGetUser({
      googleId: tokenData.googleId,
      email: tokenData.email,
      name: tokenData.name,
      picture: tokenData.picture
    });
    req.session.user = generateSessionData(user);
    return res.json({
      success: true,
      message: "Login successful!",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error("Auth error:", error);
    res.json({ success: false, message: "Authentication failed", error: error.message });
  }
});
app.get("/auth/user", (req, res) => {
  if (req.session.user) {
    res.json({ success: true, user: req.session.user });
  } else {
    res.json({ success: false, message: "No user logged in" });
  }
});
app.get('/user', (req, res) => {
  const { username, email } = req.query;
  const db = readData();
  let user = null;
  if (username) user = db.users.find(u => u.username === username);
  if (!user && email) user = db.users.find(u => u.email === email);
  if (user) return res.json({ success: true, user });
  res.json({ success: false, message: 'User not found' });
});
app.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.json({ success: false, message: "Logout failed" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
