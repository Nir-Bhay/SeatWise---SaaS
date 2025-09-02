const express = require('express');
const ExamSession = require('../models/ExamSession');
const University = require('../models/University');
const Template = require('../models/Template');
const PDFGenerator = require('../services/PDFGenerator');
const auth = require('../middleware/auth');
const router = express.Router();

// Generate seating arrangement PDF
router.post('/seating/:examId/:roomIndex', auth, async (req, res) => {
    try {
        const { examId, roomIndex } = req.params;

        // Get exam session
        const exam = await ExamSession.findOne({
            _id: examId,
            universityId: req.universityId
        });

        if (!exam || !exam.roomAllocation[roomIndex]) {
            return res.status(404).json({ message: 'Exam or room not found' });
        }

        // Get university details
        const university = await University.findById(req.universityId);

        // Get template
        const template = await Template.findOne({
            universityId: req.universityId,
            type: 'seating',
            isDefault: true
        });

        const room = exam.roomAllocation[roomIndex];
        const examData = {
            university: {
                name: university.name,
                address: university.address,
                logo: university.logo
            },
            exam: {
                title: exam.title,
                type: exam.examType,
                date: exam.date,
                time: exam.time
            },
            room: {
                number: room.roomNumber,
                building: room.buildingName,
                floor: room.floorName
            },
            seating: room.seating,
            students: room.allocatedStudents
        };

        const pdfGenerator = new PDFGenerator();
        const pdfBuffer = await pdfGenerator.generateSeatingPDF(examData, template);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=seating-${room.roomNumber}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Generate seating PDF error:', error);
        res.status(500).json({ message: 'Failed to generate seating PDF' });
    }
});

// Generate attendance sheet PDF
router.post('/attendance/:examId/:roomIndex', auth, async (req, res) => {
    try {
        const { examId, roomIndex } = req.params;

        const exam = await ExamSession.findOne({
            _id: examId,
            universityId: req.universityId
        });

        if (!exam || !exam.roomAllocation[roomIndex]) {
            return res.status(404).json({ message: 'Exam or room not found' });
        }

        const university = await University.findById(req.universityId);
        const template = await Template.findOne({
            universityId: req.universityId,
            type: 'attendance',
            isDefault: true
        });

        const room = exam.roomAllocation[roomIndex];
        const examData = {
            university: {
                name: university.name,
                address: university.address
            },
            exam: {
                title: exam.title,
                type: exam.examType,
                date: exam.date,
                time: exam.time,
                programs: exam.programs.join(', '),
                branches: exam.branches.join(', ')
            },
            room: {
                number: room.roomNumber
            },
            students: room.allocatedStudents
        };

        const pdfGenerator = new PDFGenerator();
        const pdfBuffer = await pdfGenerator.generateAttendancePDF(examData, template);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=attendance-${room.roomNumber}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Generate attendance PDF error:', error);
        res.status(500).json({ message: 'Failed to generate attendance PDF' });
    }
});

// Generate master seating plan PDF
router.post('/master/:examId', auth, async (req, res) => {
    try {
        const { examId } = req.params;

        const exam = await ExamSession.findOne({
            _id: examId,
            universityId: req.universityId
        });

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        const university = await University.findById(req.universityId);
        const template = await Template.findOne({
            universityId: req.universityId,
            type: 'master',
            isDefault: true
        });

        const examData = {
            university: {
                name: university.name,
                address: university.address
            },
            exam: {
                title: exam.title,
                type: exam.examType,
                date: exam.date,
                time: exam.time
            },
            rooms: exam.roomAllocation
        };

        const pdfGenerator = new PDFGenerator();
        const pdfBuffer = await pdfGenerator.generateMasterPDF(examData, template);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=master-plan-${exam.title}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Generate master PDF error:', error);
        res.status(500).json({ message: 'Failed to generate master PDF' });
    }
});

// Generate all PDFs for an exam
router.post('/bulk/:examId', auth, async (req, res) => {
    try {
        const { examId } = req.params;

        const exam = await ExamSession.findOne({
            _id: examId,
            universityId: req.universityId
        });

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        const university = await University.findById(req.universityId);
        const templates = {
            seating: await Template.findOne({ universityId: req.universityId, type: 'seating', isDefault: true }),
            attendance: await Template.findOne({ universityId: req.universityId, type: 'attendance', isDefault: true }),
            master: await Template.findOne({ universityId: req.universityId, type: 'master', isDefault: true })
        };

        // Prepare exam data
        exam.university = university;

        const pdfGenerator = new PDFGenerator();
        const results = await pdfGenerator.generateBulkPDFs(exam, templates);

        // Here you would typically save files and return download links
        // For now, we'll return the first seating arrangement as example
        if (results.seatingArrangements.length > 0) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=bulk-${exam.title}.pdf`);
            res.send(results.seatingArrangements[0].pdf);
        } else {
            res.status(400).json({ message: 'No documents generated' });
        }
    } catch (error) {
        console.error('Generate bulk PDFs error:', error);
        res.status(500).json({ message: 'Failed to generate bulk PDFs' });
    }
});

module.exports = router;