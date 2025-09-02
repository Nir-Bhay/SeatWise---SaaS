const express = require('express');
const multer = require('multer');
const path = require('path');
const Student = require('../models/Student');
const ExcelProcessor = require('../services/ExcelProcessor');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel and CSV files are allowed'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all students with filters
router.get('/', auth, async (req, res) => {
    try {
        const {
            program,
            branch,
            semester,
            year,
            status,
            minAttendance,
            page = 1,
            limit = 50
        } = req.query;

        const query = { universityId: req.universityId };

        // Apply filters
        if (program) query.program = program;
        if (branch) query.branch = branch;
        if (semester) query.semester = semester;
        if (year) query.year = year;
        if (status) query.status = status;
        if (minAttendance) query.attendancePercent = { $gte: parseInt(minAttendance) };

        const skip = (page - 1) * limit;

        const students = await Student.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ enrollmentNo: 1 });

        const total = await Student.countDocuments(query);

        res.json({
            students,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Failed to fetch students' });
    }
});

// Upload Excel file
router.post('/upload', auth, upload.single('studentFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const processor = new ExcelProcessor();
        const result = await processor.processStudentExcel(req.file.path, req.universityId);

        // Save to database
        const saveResult = await processor.saveStudentsToDatabase(result.students);

        res.json({
            message: 'File processed successfully',
            summary: {
                totalRows: result.totalRows,
                validStudents: result.validStudents,
                inserted: saveResult.inserted,
                updated: saveResult.updated,
                errors: saveResult.errors
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get sample template
router.get('/template', (req, res) => {
    try {
        const processor = new ExcelProcessor();
        const template = processor.generateSampleTemplate();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=student-template.xlsx');
        res.send(template);
    } catch (error) {
        console.error('Template generation error:', error);
        res.status(500).json({ message: 'Failed to generate template' });
    }
});

// Get students for exam (with filters)
// Get students for exam (with filters)
router.post('/exam-eligible', auth, async (req, res) => {
    try {
        const {
            programs,
            branches,
            semesters,
            years,
            minAttendance = 75,
            allowedStatus = ['Regular'],
            allowedFeeStatus = ['Paid']
        } = req.body;

        const query = { universityId: req.universityId };

        // Apply filters
        if (programs && programs.length > 0) query.program = { $in: programs };
        if (branches && branches.length > 0) query.branch = { $in: branches };
        if (semesters && semesters.length > 0) query.semester = { $in: semesters };
        if (years && years.length > 0) query.year = { $in: years };
        if (minAttendance) query.attendancePercent = { $gte: minAttendance };
        if (allowedStatus && allowedStatus.length > 0) query.status = { $in: allowedStatus };
        if (allowedFeeStatus && allowedFeeStatus.length > 0) query.feeStatus = { $in: allowedFeeStatus };

        const students = await Student.find(query).sort({ branch: 1, enrollmentNo: 1 });

        // Group by branch for statistics
        const branchStats = {};
        students.forEach(student => {
            if (!branchStats[student.branch]) {
                branchStats[student.branch] = 0;
            }
            branchStats[student.branch]++;
        });

        res.json({
            students,
            total: students.length,
            branchStats
        });
    } catch (error) {
        console.error('Exam eligible students error:', error);
        res.status(500).json({ message: 'Failed to fetch exam eligible students' });
    }
});

// Add single student
router.post('/', auth, async (req, res) => {
    try {
        const studentData = {
            ...req.body,
            universityId: req.universityId
        };

        const student = new Student(studentData);
        await student.save();

        res.status(201).json({
            message: 'Student added successfully',
            student
        });
    } catch (error) {
        console.error('Add student error:', error);
        res.status(500).json({ message: 'Failed to add student' });
    }
});

// Update student
router.put('/:id', auth, async (req, res) => {
    try {
        const student = await Student.findOneAndUpdate(
            { _id: req.params.id, universityId: req.universityId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({
            message: 'Student updated successfully',
            student
        });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ message: 'Failed to update student' });
    }
});

// Delete student
router.delete('/:id', auth, async (req, res) => {
    try {
        const student = await Student.findOneAndDelete({
            _id: req.params.id,
            universityId: req.universityId
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ message: 'Failed to delete student' });
    }
});

module.exports = router;