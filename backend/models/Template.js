const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    universityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['seating', 'attendance', 'master'],
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    layout: {
        header: {
            universityName: { show: Boolean, text: String, style: Object },
            roomNo: { show: Boolean, text: String, style: Object },
            time: { show: Boolean, text: String, style: Object },
            date: { show: Boolean, text: String, style: Object },
            examTitle: { show: Boolean, text: String, style: Object }
        },
        body: {
            grid: {
                arrangement: { type: String, enum: ['horizontal', 'vertical'], default: 'vertical' },
                cellStyle: Object,
                showBorders: { type: Boolean, default: true }
            },
            table: {
                columns: [String],
                rowHeight: Number,
                cellStyle: Object
            }
        },
        footer: {
            program: { show: Boolean, text: String, style: Object },
            branch: { show: Boolean, text: String, style: Object },
            semester: { show: Boolean, text: String, style: Object },
            totalCandidates: { show: Boolean, text: String, style: Object },
            signatures: { show: Boolean, labels: [String], style: Object }
        }
    },
    customization: {
        colors: {
            primary: { type: String, default: '#2563EB' },
            secondary: { type: String, default: '#6B7280' },
            background: { type: String, default: '#FFFFFF' }
        },
        fonts: {
            header: { type: String, default: 'Arial' },
            body: { type: String, default: 'Arial' },
            size: { type: Number, default: 12 }
        },
        logo: {
            show: { type: Boolean, default: true },
            position: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
            size: { width: Number, height: Number }
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Template', templateSchema);