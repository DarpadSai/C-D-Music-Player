const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    likedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    // New fields for OTP
    otp: { type: String },
    otpExpires: { type: Date }
});

module.exports = mongoose.model('User', UserSchema);