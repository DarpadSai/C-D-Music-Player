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

// ALLOW CORS (Crucial for Frontend Communication)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- CONFIG ---
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/musicplayer";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

// Connect Mongoose (For Auth & Metadata)
mongoose.connect(mongoURI)
    .then(() => console.log("Mongoose Connected"))
    .catch(err => console.log(err));

// Connect Native Driver (For GridFS Streaming)
const conn = mongoose.createConnection(mongoURI);
let gridfsBucket;
conn.once('open', () => {
    console.log('GridFS Connected');
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'songs' });
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- MIDDLEWARE ---
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ err: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).json({ err: 'Failed to authenticate token' });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const verifyAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') return res.status(403).json({ err: 'Admins only!' });
    next();
};

// --- AUTH ROUTES ---

app.post('/register', async (req, res) => {
    try {
        const { username, password, adminKey } = req.body;
        const hashedPassword = await bcrypt.hash(password, 8);
        const role = (adminKey === 'admin123') ? 'admin' : 'user';
        const user = await User.create({ username, password: hashedPassword, role });
        res.json({ msg: 'User created!', role, username: user.username });
    } catch (err) { res.status(500).json({ err: 'User exists or error' }); }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ err: 'User not found' });

        const passwordIsValid = await bcrypt.compare(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ err: 'Invalid Password' });

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ auth: true, token, role: user.role, username: user.username });
    } catch (err) { res.status(500).json({ err: 'Server error' }); }
});

// --- USER MANAGEMENT & PROFILE ---

// 1. Update Own Profile (New)
app.put('/users/profile', verifyToken, async (req, res) => {
    try {
        const { username, password } = req.body;
        const updates = {};
        if (username) updates.username = username;
        if (password) updates.password = await bcrypt.hash(password, 8);

        const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
        res.json({ msg: 'Profile Updated', username: user.username });
    } catch (err) { res.status(500).json({ err: 'Update failed' }); }
});

// 2. Upload Avatar
app.post('/users/avatar', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        user.avatar = req.file.buffer;
        user.avatarType = req.file.mimetype;
        await user.save();
        res.json({ msg: 'Avatar updated' });
    } catch (e) { res.status(500).json({ err: 'Failed' }); }
});

// 3. Get Avatar
app.get('/users/:username/avatar', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user || !user.avatar) {
            return res.redirect(`https://ui-avatars.com/api/?name=${req.params.username}&background=00f3ff&color=000`);
        }
        res.set('Content-Type', user.avatarType);
        res.send(user.avatar);
    } catch (e) { res.status(404).send('Not found'); }
});

// 4. Admin User List
app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password -avatar'); 
        res.json(users);
    } catch (err) { res.status(500).json({ err: 'Fetch failed' }); }
});

app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User deleted' });
    } catch (err) { res.status(500).json({ err: 'Delete failed' }); }
});

// --- OTP / FORGOT PASSWORD ---
app.post('/forgot-password', async (req, res) => {
    const { username } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ err: 'User not found' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 300000; // 5 mins
    await user.save();

    console.log(`[OTP SYSTEM] Code for ${username}: ${otp}`);
    res.json({ msg: 'OTP sent to backend console' });
});

app.post('/reset-password', async (req, res) => {
    const { username, otp, newPassword } = req.body;
    const user = await User.findOne({ username });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
        return res.status(400).json({ err: 'Invalid or Expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 8);
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ msg: 'Password reset successful' });
});

// --- SONG MANAGEMENT ---

// 1. UPLOAD (Fail-Safe with Metadata)
app.post('/upload', verifyToken, verifyAdmin, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ err: 'No file' });
    
    console.log(`[UPLOAD] Processing: ${req.file.originalname}`);

    try {
        // A. Upload to GridFS
        const writestream = gridfsBucket.openUploadStream(req.file.originalname, { 
            contentType: req.file.mimetype 
        });
        Readable.from(req.file.buffer).pipe(writestream);

        // B. Extract Metadata
        let title = req.file.originalname.replace(/\.[^/.]+$/, "");
        let artist = 'Unknown Artist';
        let album = 'Unknown Album';
        let duration = 0;
        let picture = null;
        let pictureType = null;

        try {
            const { parseBuffer } = require('music-metadata');
            const metadata = await parseBuffer(req.file.buffer, req.file.mimetype);
            
            if (metadata.common.title) title = metadata.common.title;
            if (metadata.common.artist) artist = metadata.common.artist;
            if (metadata.common.album) album = metadata.common.album;
            if (metadata.format.duration) duration = metadata.format.duration;
            
            if (metadata.common.picture && metadata.common.picture.length > 0) {
                picture = Buffer.from(metadata.common.picture[0].data);
                pictureType = metadata.common.picture[0].format;
            }
        } catch (metaErr) {
            console.log("[UPLOAD] Metadata failed, using defaults.");
        }

        writestream.on('finish', async (file) => {
            try {
                const newSong = await Song.create({
                    title, artist, album, duration,
                    filename: file.filename,
                    picture, pictureType,
                    uploadedBy: req.userId
                });
                const { picture: _, ...songData } = newSong._doc;
                res.status(201).json(songData);
            } catch (dbErr) { res.status(500).json({ err: 'DB Save Failed' }); }
        });

    } catch (err) { res.status(500).json({ err: 'Upload failed' }); }
});

// 2. GET ALL SONGS
app.get('/songs', verifyToken, async (req, res) => {
    const songs = await Song.find().select('-picture').sort({ createdAt: -1 });
    const user = await User.findById(req.userId);
    
    const songsWithLikes = songs.map(song => ({
        ...song._doc,
        isLiked: user.likedSongs.includes(song._id)
    }));
    res.json(songsWithLikes);
});

// 3. UPDATE SONG
app.put('/songs/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const song = await Song.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(song);
    } catch (e) { res.status(500).json({ err: 'Update failed' }); }
});

// 4. SERVE COVER IMAGE
app.get('/songs/:id/cover', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song || !song.picture) return res.redirect('https://via.placeholder.com/300x300.png?text=No+Cover');
        res.set('Content-Type', song.pictureType);
        res.send(song.picture);
    } catch (e) { res.status(500).send('Error'); }
});

// 5. TOGGLE LIKE
app.post('/songs/like/:id', verifyToken, async (req, res) => {
    const user = await User.findById(req.userId);
    const songId = req.params.id;
    const index = user.likedSongs.indexOf(songId);
    if (index === -1) user.likedSongs.push(songId);
    else user.likedSongs.splice(index, 1);
    await user.save();
    res.json({ liked: index === -1 });
});

// 6. DELETE SONG
app.delete('/songs/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) return res.status(404).json({ err: 'Not found' });

        const files = await gridfsBucket.find({ filename: song.filename }).toArray();
        if (files.length > 0) await gridfsBucket.delete(files[0]._id);

        await Song.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Deleted' });
    } catch (err) { res.status(500).json({ err: 'Delete failed' }); }
});

// --- PLAYLISTS ---

app.post('/playlists', verifyToken, async (req, res) => {
    try {
        const isPublic = req.userRole === 'admin';
        const playlist = await Playlist.create({ 
            name: req.body.name, 
            createdBy: req.userId,
            isPublic: isPublic,
            songs: [] 
        });
        res.json(playlist);
    } catch (e) { res.status(500).json({err: 'Error creating playlist'}); }
});

app.get('/playlists/user', verifyToken, async (req, res) => {
    try {
        const playlists = await Playlist.find({ createdBy: req.userId }).populate('songs', '-picture'); 
        res.json(playlists);
    } catch (e) { res.status(500).json({err: 'Error'}); }
});

app.get('/playlists/public', verifyToken, async (req, res) => {
    try {
        const playlists = await Playlist.find({ isPublic: true }).populate('songs', '-picture');
        res.json(playlists);
    } catch (e) { res.status(500).json({err: 'Error'}); }
});

app.delete('/playlists/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        await Playlist.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Playlist deleted' });
    } catch (e) { res.status(500).json({err: 'Error deleting playlist'}); }
});

app.post('/playlists/:id/add', verifyToken, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (playlist.createdBy.toString() !== req.userId) return res.status(403).json({err:'Not yours'});
        
        if (!playlist.songs.includes(req.body.songId)) {
            playlist.songs.push(req.body.songId);
            await playlist.save();
        }
        res.json(playlist);
    } catch (e) { res.status(500).json({err: 'Error adding song'}); }
});

app.get('/playlists/:id', verifyToken, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id).populate({ path: 'songs', select: '-picture' });
        const user = await User.findById(req.userId);
        const songsWithLikes = playlist.songs.map(song => ({ ...song._doc, isLiked: user.likedSongs.includes(song._id) }));
        res.json({ ...playlist._doc, songs: songsWithLikes });
    } catch (e) { res.status(500).json({err: 'Error'}); }
});

// --- STREAMING ---
app.get('/play/:filename', async (req, res) => {
    if (!gridfsBucket) return res.status(500).json({ err: 'DB error' });

    try {
        const files = await gridfsBucket.find({ filename: req.params.filename }).toArray();
        if (!files || files.length === 0) return res.status(404).json({ err: 'No file' });

        const file = files[0];
        const fileSize = file.length;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            const downloadStream = gridfsBucket.openDownloadStreamByName(req.params.filename, { start, end: end + 1 });
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'audio/mp3',
            });
            downloadStream.pipe(res);
        } else {
            res.header('Content-Length', fileSize);
            res.header('Content-Type', 'audio/mp3');
            res.header('Accept-Ranges', 'bytes');
            gridfsBucket.openDownloadStreamByName(req.params.filename).pipe(res);
        }
    } catch (err) { res.status(500).json({ err: 'Stream error' }); }
});

const port = 5000;
app.listen(port, () => console.log(`Server running on ${port}`));