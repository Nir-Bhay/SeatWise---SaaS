const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const University = require('../models/University');
const router = express.Router();

// Register university
router.post('/register', async (req, res) => {
    try {
        const { name, address, domain, adminEmail, password } = req.body;

        // Check if university already exists
        const existingUniversity = await University.findOne({ domain });
        if (existingUniversity) {
            return res.status(400).json({ message: 'University domain already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create university
        const university = new University({
            name,
            address,
            domain,
            adminEmail,
            password: hashedPassword
        });

        await university.save();

        // Generate JWT
        const token = jwt.sign(
            { universityId: university._id, domain: university.domain },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'University registered successfully',
            token,
            university: {
                id: university._id,
                name: university.name,
                domain: university.domain
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { domain, password } = req.body;

        // Find university
        const university = await University.findOne({ domain });
        if (!university) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, university.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { universityId: university._id, domain: university.domain },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            university: {
                id: university._id,
                name: university.name,
                domain: university.domain,
                subscription: university.subscription
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
});

// Add this route to auth.js
router.get('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const university = await University.findById(decoded.universityId);

        if (!university) {
            return res.status(401).json({ success: false, message: 'University not found' });
        }

        res.json({
            success: true,
            university: {
                id: university._id,
                name: university.name,
                domain: university.domain,
                subscription: university.subscription
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});



module.exports = router;