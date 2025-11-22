const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    likedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    otp: { type: String },
    otpExpires: { type: Date },
    
    // NEW: Profile Picture
    avatar: { type: Buffer },
    avatarType: { type: String }
});

module.exports = mongoose.model('User', UserSchema);