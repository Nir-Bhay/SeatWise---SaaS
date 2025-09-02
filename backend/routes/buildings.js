const express = require('express');
const Building = require('../models/Building');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all buildings
router.get('/', auth, async (req, res) => {
    try {
        const buildings = await Building.find({ universityId: req.universityId });
        res.json(buildings);
    } catch (error) {
        console.error('Get buildings error:', error);
        res.status(500).json({ message: 'Failed to fetch buildings' });
    }
});

// Get single building
router.get('/:id', auth, async (req, res) => {
    try {
        const building = await Building.findOne({
            _id: req.params.id,
            universityId: req.universityId
        });

        if (!building) {
            return res.status(404).json({ message: 'Building not found' });
        }

        res.json(building);
    } catch (error) {
        console.error('Get building error:', error);
        res.status(500).json({ message: 'Failed to fetch building' });
    }
});

// Create building
router.post('/', auth, async (req, res) => {
    try {
        const buildingData = {
            ...req.body,
            universityId: req.universityId
        };

        const building = new Building(buildingData);
        await building.save();

        res.status(201).json({
            message: 'Building created successfully',
            building
        });
    } catch (error) {
        console.error('Create building error:', error);
        res.status(500).json({ message: 'Failed to create building' });
    }
});

// Update building
router.put('/:id', auth, async (req, res) => {
    try {
        const building = await Building.findOneAndUpdate(
            { _id: req.params.id, universityId: req.universityId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!building) {
            return res.status(404).json({ message: 'Building not found' });
        }

        res.json({
            message: 'Building updated successfully',
            building
        });
    } catch (error) {
        console.error('Update building error:', error);
        res.status(500).json({ message: 'Failed to update building' });
    }
});

// Delete building
router.delete('/:id', auth, async (req, res) => {
    try {
        const building = await Building.findOneAndDelete({
            _id: req.params.id,
            universityId: req.universityId
        });

        if (!building) {
            return res.status(404).json({ message: 'Building not found' });
        }

        res.json({ message: 'Building deleted successfully' });
    } catch (error) {
        console.error('Delete building error:', error);
        res.status(500).json({ message: 'Failed to delete building' });
    }
});

// Get available rooms for exam
router.post('/available-rooms', auth, async (req, res) => {
    try {
        const { date, timeSlot, requiredCapacity } = req.body;

        const buildings = await Building.find({ universityId: req.universityId });
        const availableRooms = [];

        buildings.forEach(building => {
            building.floors.forEach(floor => {
                floor.rooms.forEach(room => {
                    if (room.status === 'available' &&
                        (!requiredCapacity || room.capacity >= requiredCapacity)) {
                        availableRooms.push({
                            buildingId: building._id,
                            buildingName: building.name,
                            floorName: floor.name,
                            roomNumber: room.number,
                            capacity: room.capacity,
                            rows: room.rows,
                            columns: room.columns,
                            facilities: room.facilities
                        });
                    }
                });
            });
        });

        res.json({
            availableRooms,
            totalCapacity: availableRooms.reduce((sum, room) => sum + room.capacity, 0)
        });
    } catch (error) {
        console.error('Available rooms error:', error);
        res.status(500).json({ message: 'Failed to fetch available rooms' });
    }
});

module.exports = router;