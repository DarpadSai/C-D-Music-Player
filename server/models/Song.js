const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: String, default: 'Unknown Artist' },
    album: { type: String, default: 'Unknown Album' },
    duration: { type: Number, default: 0 }, // In seconds
    filename: { type: String, required: true },
    
    // NEW: Cover Art Storage
    picture: { type: Buffer },     // The actual image data
    pictureType: { type: String }, // e.g., "image/jpeg"
    
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Song', SongSchema);