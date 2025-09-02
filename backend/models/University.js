const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true
    },
    logo: {
        type: String,
        default: ''
    },
    domain: {
        type: String,
        required: true,
        unique: true
    },
    adminEmail: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    settings: {
        defaultAttendancePercent: {
            type: Number,
            default: 75
        },
        examRules: {
            branchMixing: {
                type: Boolean,
                default: true
            },
            minSeatGap: {
                type: Number,
                default: 1
            }
        },
        templates: {
            seating: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Template'
            },
            attendance: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Template'
            },
            master: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Template'
            }
        }
    },
    subscription: {
        plan: {
            type: String,
            enum: ['basic', 'pro', 'enterprise'],
            default: 'basic'
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'trial'],
            default: 'trial'
        },
        validUntil: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('University', universitySchema);