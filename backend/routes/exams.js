const express = require('express');
const ExamSession = require('../models/ExamSession');
const Student = require('../models/Student');
const Building = require('../models/Building');
const SeatingAlgorithm = require('../services/SeatingAlgorithm');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all exam sessions
router.get('/', auth, async (req, res) => {
    try {
        const exams = await ExamSession.find({ universityId: req.universityId })
            .sort({ createdAt: -1 });
        res.json(exams);
    } catch (error) {
        console.error('Get exams error:', error);
        res.status(500).json({ message: 'Failed to fetch exams' });
    }
});

// Create new exam session
router.post('/', auth, async (req, res) => {
    try {
        const examData = {
            ...req.body,
            universityId: req.universityId
        };

        const exam = new ExamSession(examData);
        await exam.save();

        res.status(201).json({
            message: 'Exam session created successfully',
            exam
        });
    } catch (error) {
        console.error('Create exam error:', error);
        res.status(500).json({ message: 'Failed to create exam session' });
    }
});

// Generate seating arrangement
router.post('/:id/generate-seating', auth, async (req, res) => {
    try {
        const examId = req.params.id;
        const { selectedRooms, seatingRules } = req.body;

        // Get exam session
        const exam = await ExamSession.findOne({
            _id: examId,
            universityId: req.universityId
        });

        if (!exam) {
            return res.status(404).json({ message: 'Exam session not found' });
        }

        // Get eligible students
        const students = await Student.find({
            universityId: req.universityId,
            program: { $in: exam.programs },
            branch: { $in: exam.branches },
            semester: { $in: exam.semesters },
            attendancePercent: { $gte: exam.studentFilters.attendancePercent },
            status: { $in: exam.studentFilters.status || ['Regular'] },
            feeStatus: { $in: exam.studentFilters.feeStatus || ['Paid'] }
        });

        // Get room details
        const roomDetails = [];
        for (const selectedRoom of selectedRooms) {
            const building = await Building.findById(selectedRoom.buildingId);
            const floor = building.floors.find(f => f.name === selectedRoom.floorName);
            const room = floor.rooms.find(r => r.number === selectedRoom.roomNumber);

            roomDetails.push({
                buildingId: selectedRoom.buildingId,
                buildingName: building.name,
                floorName: selectedRoom.floorName,
                roomNumber: selectedRoom.roomNumber,
                rows: room.rows,
                columns: room.columns,
                capacity: room.capacity
            });
        }

        // Generate seating using algorithm
        const seatingAlgorithm = new SeatingAlgorithm();
        const allocation = seatingAlgorithm.allocateMultipleRooms(
            students,
            roomDetails,
            { ...seatingRules, ...exam.seatingRules }
        );

        // Update exam session with allocation
        exam.roomAllocation = allocation.allocations.map(alloc => ({
            buildingId: alloc.room.buildingId,
            buildingName: alloc.room.buildingName,
            floorName: alloc.room.floorName,
            roomNumber: alloc.room.roomNumber,
            capacity: alloc.room.capacity,
            allocatedStudents: alloc.students.map((student, index) => ({
                studentId: student._id,
                enrollmentNo: student.enrollmentNo,
                name: student.name,
                branch: student.branch,
                position: this.getPositionFromIndex(index, alloc.room, seatingRules)
            })),
            seating: alloc.seating
        }));

        exam.status = 'ready';
        await exam.save();

        res.json({
            message: 'Seating arrangement generated successfully',
            allocation: exam.roomAllocation,
            unallocatedStudents: allocation.unallocatedStudents.length
        });
    } catch (error) {
        console.error('Generate seating error:', error);
        res.status(500).json({ message: 'Failed to generate seating arrangement' });
    }
});

// Helper function to get position from index
function getPositionFromIndex(index, room, rules) {
    if (rules.arrangement === 'horizontal') {
        return {
            row: Math.floor(index / room.columns),
            column: index % room.columns
        };
    } else {
        return {
            row: index % room.rows,
            column: Math.floor(index / room.rows)
        };
    }
}

// Get exam details with seating
router.get('/:id', auth, async (req, res) => {
    try {
        const exam = await ExamSession.findOne({
            _id: req.params.id,
            universityId: req.universityId
        }).populate('roomAllocation.allocatedStudents.studentId');

        if (!exam) {
            return res.status(404).json({ message: 'Exam session not found' });
        }

        res.json(exam);
    } catch (error) {
        console.error('Get exam details error:', error);
        res.status(500).json({ message: 'Failed to fetch exam details' });
    }
});

// Update exam session
router.put('/:id', auth, async (req, res) => {
    try {
        const exam = await ExamSession.findOneAndUpdate(
            { _id: req.params.id, universityId: req.universityId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!exam) {
            return res.status(404).json({ message: 'Exam session not found' });
        }

        res.json({
            message: 'Exam session updated successfully',
            exam
        });
    } catch (error) {
        console.error('Update exam error:', error);
        res.status(500).json({ message: 'Failed to update exam session' });
    }
});

// Delete exam session
router.delete('/:id', auth, async (req, res) => {
    try {
        const exam = await ExamSession.findOneAndDelete({
            _id: req.params.id,
            universityId: req.universityId
        });

        if (!exam) {
            return res.status(404).json({ message: 'Exam session not found' });
        }

        res.json({ message: 'Exam session deleted successfully' });
    } catch (error) {
        console.error('Delete exam error:', error);
        res.status(500).json({ message: 'Failed to delete exam session' });
    }
});

module.exports = router;