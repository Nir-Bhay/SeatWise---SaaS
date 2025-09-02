const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
    universityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    examType: {
        type: String,
        enum: ['MST-1', 'MST-2', 'ESE', 'Internal', 'Custom'],
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        start: String,
        end: String
    },
    programs: [String],
    branches: [String],
    semesters: [String],
    studentFilters: {
        attendancePercent: { type: Number, default: 75 },
        status: [String],
        feeStatus: [String]
    },
    roomAllocation: [{
        buildingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Building'
        },
        floorName: String,
        roomNumber: String,
        capacity: Number,
        allocatedStudents: [{
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Student'
            },
            position: {
                row: Number,
                column: Number
            }
        }]
    }],
    seatingRules: {
        arrangement: {
            type: String,
            enum: ['horizontal', 'vertical'],
            default: 'vertical'
        },
        branchMixing: {
            type: Boolean,
            default: true
        },
        skipRows: {
            type: Number,
            default: 0
        },
        doubleColumns: [Number]
    },
    generatedDocuments: {
        seatingArrangements: [String], // File paths
        attendanceSheets: [String],
        masterPlan: String
    },
    status: {
        type: String,
        enum: ['draft', 'ready', 'completed'],
        default: 'draft'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ExamSession', examSessionSchema);