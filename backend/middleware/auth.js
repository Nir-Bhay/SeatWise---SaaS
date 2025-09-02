const jwt = require('jsonwebtoken');
const University = require('../models/University');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

        // Check if university still exists and is active
        const university = await University.findById(decoded.universityId);
        if (!university || university.subscription.status === 'inactive') {
            return res.status(401).json({ message: 'Access denied. Invalid or inactive account.' });
        }

        req.universityId = decoded.universityId;
        req.universityDomain = decoded.domain;
        req.university = university;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Invalid token.' });
    }
};

module.exports = auth;