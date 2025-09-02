const express = require('express');
const University = require('../models/University');
const auth = require('../middleware/auth');
const router = express.Router();

// Get university details
router.get('/profile', auth, async (req, res) => {
    try {
        const university = await University.findById(req.universityId);
        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }
        res.json(university);
    } catch (error) {
        console.error('Get university profile error:', error);
        res.status(500).json({ message: 'Failed to fetch university profile' });
    }
});

// Update university profile
router.put('/profile', auth, async (req, res) => {
    try {
        const university = await University.findByIdAndUpdate(
            req.universityId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }

        res.json({
            message: 'University profile updated successfully',
            university
        });
    } catch (error) {
        console.error('Update university profile error:', error);
        res.status(500).json({ message: 'Failed to update university profile' });
    }
});

module.exports = router;