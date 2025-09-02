const express = require('express');
const router = express.Router();

// GET /api/templates - Get all templates
router.get('/', async (req, res) => {
    try {
        res.json({
            message: 'Templates route working',
            templates: []
        });
    } catch (error) {
        console.error('Templates error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/templates - Create new template
router.post('/', async (req, res) => {
    try {
        res.json({
            message: 'Template created',
            template: req.body
        });
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;