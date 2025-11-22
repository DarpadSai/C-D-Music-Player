const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const { Readable } = require('stream');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Import Models
const User = require('./models/User');
const Song = require('./models/Song');
const Playlist = require('./models/Playlist');
require('dotenv').config();

const app = express();

// ALLOW CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- CONFIG ---
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/musicplayer";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

mongoose.connect(mongoURI)
    .then(() => console.log("Mongoose Connected"))
    .catch(err => console.log(err));

const conn = mongoose.createConnection(mongoURI);
let gridfsBucket;
conn.once('open', () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'songs' });
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- MIDDLEWARE ---
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ err: 'No token' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).json({ err: 'Auth failed' });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const verifyAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') return res.status(403).json({ err: 'Admins only' });
    next();
};

// --- AUTH ---
app.post('/register', async (req, res) => {
    try {
        const { username, password, adminKey } = req.body;
        const hashedPassword = await bcrypt.hash(password, 8);
        const role = (adminKey === 'admin123') ? 'admin' : 'user';
        await User.create({ username, password: hashedPassword, role });
        res.json({ msg: 'User created!', role, username });
    } catch (err) { res.status(500).json({ err: 'User exists' }); }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ err: 'Invalid credentials' });
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ auth: true, token, role: user.role, username: user.username });
    } catch (err) { res.status(500).json({ err: 'Server error' }); }
});

// --- USER MANAGEMENT ---
app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    const users = await User.find({}, '-password');
    res.json(users);
});

app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
});

app.post('/users/avatar', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        user.avatar = req.file.buffer;
        user.avatarType = req.file.mimetype;
        await user.save();
        res.json({ msg: 'Avatar updated' });
    } catch (e) { res.status(500).json({ err: 'Failed' }); }
});

app.get('/users/:username/avatar', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user || !user.avatar) return res.redirect(`https://ui-avatars.com/api/?name=${req.params.username}&background=1DB954&color=fff`);
        res.set('Content-Type', user.avatarType);
        res.send(user.avatar);
    } catch (e) { res.status(404).send('Not found'); }
});

// --- SONGS ---
app.post('/upload', verifyToken, verifyAdmin, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ err: 'No file' });
    
    try {
        const writestream = gridfsBucket.openUploadStream(req.file.originalname, { contentType: req.file.mimetype });
        Readable.from(req.file.buffer).pipe(writestream);

        // Metadata Extraction
        let title = req.file.originalname.replace(/\.[^/.]+$/, "");
        let artist = 'Unknown Artist';
        let picture = null;
        let pictureType = null;

        try {
            const { parseBuffer } = require('music-metadata');
            const metadata = await parseBuffer(req.file.buffer, req.file.mimetype);
            if (metadata.common.title) title = metadata.common.title;
            if (metadata.common.artist) artist = metadata.common.artist;
            if (metadata.common.picture && metadata.common.picture.length > 0) {
                picture = Buffer.from(metadata.common.picture[0].data);
                pictureType = metadata.common.picture[0].format;
            }
        } catch (e) { console.log("Metadata failed, using defaults"); }

        writestream.on('finish', async (file) => {
            const newSong = await Song.create({ title, artist, filename: file.filename, picture, pictureType, uploadedBy: req.userId });
            const { picture: _, ...songData } = newSong._doc;
            res.status(201).json(songData);
        });
    } catch (err) { res.status(500).json({ err: 'Upload failed' }); }
});

app.put('/songs/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const song = await Song.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(song);
    } catch (e) { res.status(500).json({ err: 'Update failed' }); }
});

app.get('/songs', verifyToken, async (req, res) => {
    const songs = await Song.find().select('-picture').sort({ createdAt: -1 });
    const user = await User.findById(req.userId);
    const songsWithLikes = songs.map(song => ({ ...song._doc, isLiked: user.likedSongs.includes(song._id) }));
    res.json(songsWithLikes);
});

app.get('/songs/:id/cover', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song || !song.picture) return res.redirect('https://via.placeholder.com/300x300.png?text=No+Cover');
        res.set('Content-Type', song.pictureType);
        res.send(song.picture);
    } catch (e) { res.status(500).send('Error'); }
});

app.post('/songs/like/:id', verifyToken, async (req, res) => {
    const user = await User.findById(req.userId);
    const index = user.likedSongs.indexOf(req.params.id);
    if (index === -1) user.likedSongs.push(req.params.id);
    else user.likedSongs.splice(index, 1);
    await user.save();
    res.json({ liked: index === -1 });
});

app.delete('/songs/:id', verifyToken, verifyAdmin, async (req, res) => {
    const song = await Song.findById(req.params.id);
    if (song) {
        const files = await gridfsBucket.find({ filename: song.filename }).toArray();
        if (files.length > 0) await gridfsBucket.delete(files[0]._id);
        await Song.findByIdAndDelete(req.params.id);
    }
    res.json({ msg: 'Deleted' });
});

// --- PLAYLISTS ---
app.post('/playlists', verifyToken, async (req, res) => {
    const isPublic = req.userRole === 'admin';
    const playlist = await Playlist.create({ name: req.body.name, createdBy: req.userId, isPublic, songs: [] });
    res.json(playlist);
});

app.get('/playlists/user', verifyToken, async (req, res) => {
    const playlists = await Playlist.find({ createdBy: req.userId }).populate('songs', '-picture');
    res.json(playlists);
});

app.get('/playlists/public', verifyToken, async (req, res) => {
    const playlists = await Playlist.find({ isPublic: true }).populate('songs', '-picture');
    res.json(playlists);
});

app.delete('/playlists/:id', verifyToken, verifyAdmin, async (req, res) => {
    await Playlist.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
});

app.post('/playlists/:id/add', verifyToken, async (req, res) => {
    const playlist = await Playlist.findById(req.params.id);
    if (playlist.createdBy.toString() !== req.userId) return res.status(403).json({err:'Not yours'});
    if (!playlist.songs.includes(req.body.songId)) {
        playlist.songs.push(req.body.songId);
        await playlist.save();
    }
    res.json(playlist);
});

app.get('/playlists/:id', verifyToken, async (req, res) => {
    const playlist = await Playlist.findById(req.params.id).populate({ path: 'songs', select: '-picture' });
    const user = await User.findById(req.userId);
    const songsWithLikes = playlist.songs.map(song => ({ ...song._doc, isLiked: user.likedSongs.includes(song._id) }));
    res.json({ ...playlist._doc, songs: songsWithLikes });
});

// --- STREAMING ---
app.get('/play/:filename', async (req, res) => {
    try {
        const files = await gridfsBucket.find({ filename: req.params.filename }).toArray();
        if (!files || files.length === 0) return res.status(404).json({ err: 'No file' });
        const file = files[0];
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
            const chunksize = (end - start) + 1;
            const stream = gridfsBucket.openDownloadStreamByName(req.params.filename, { start, end: end + 1 });
            res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${file.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'audio/mp3' });
            stream.pipe(res);
        } else {
            res.header('Content-Length', file.length);
            res.header('Content-Type', 'audio/mp3');
            res.header('Accept-Ranges', 'bytes');
            gridfsBucket.openDownloadStreamByName(req.params.filename).pipe(res);
        }
    } catch (err) { res.status(500).json({ err: 'Stream error' }); }
});

app.listen(5000, () => console.log("Server running on 5000"));