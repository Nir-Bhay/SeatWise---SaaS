const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true
    },
    rows: {
        type: Number,
        required: true
    },
    columns: {
        type: Number,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    facilities: [{
        type: String,
        enum: ['AC', 'Projector', 'Microphone', 'CCTV', 'Podium']
    }],
    status: {
        type: String,
        enum: ['available', 'maintenance', 'booked'],
        default: 'available'
    }
});

const floorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rooms: [roomSchema],
    totalCapacity: {
        type: Number,
        default: 0
    }
});

const buildingSchema = new mongoose.Schema({
    universityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    floors: [floorSchema],
    grandTotal: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Calculate totals before saving
buildingSchema.pre('save', function (next) {
    this.floors.forEach(floor => {
        floor.totalCapacity = floor.rooms.reduce((sum, room) => sum + room.capacity, 0);
    });
    this.grandTotal = this.floors.reduce((sum, floor) => sum + floor.totalCapacity, 0);
    next();
});

module.exports = mongoose.model('Building', buildingSchema);