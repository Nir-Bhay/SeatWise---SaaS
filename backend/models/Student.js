const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    universityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    enrollmentNo: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    program: {
        type: String,
        required: true,
        trim: true
    },
    branch: {
        type: String,
        required: true,
        trim: true
    },
    semester: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    section: {
        type: String,
        default: 'A'
    },
    status: {
        type: String,
        enum: ['Regular', 'Backlog', 'Ex'],
        default: 'Regular'
    },
    attendancePercent: {
        type: Number,
        default: 100
    },
    examEligibility: {
        type: Boolean,
        default: true
    },
    feeStatus: {
        type: String,
        enum: ['Paid', 'Pending', 'Partial'],
        default: 'Paid'
    }
}, {
    timestamps: true
});

// Index for faster queries
studentSchema.index({ universityId: 1, enrollmentNo: 1 });
studentSchema.index({ universityId: 1, branch: 1, semester: 1 });

module.exports = mongoose.model('Student', studentSchema);