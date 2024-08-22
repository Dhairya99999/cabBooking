import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // Retrieve the Authorization header
    const authHeader = req.header('Authorization');

    // Check if the Authorization header is present
    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Extract the token from the header
    const token = authHeader.replace('Bearer ', '').trim(); // Added a space after 'Bearer ' to match the typical format

    // Validate that we have a token after replacement
    if (!token) {
        return res.status(401).json({ message: 'Access denied. Invalid token format.' });
    }

    try {
        // Verify the token using jwt.verify
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        // Handle verification errors
        res.status(400).json({ error: 'Invalid token.' });
    }
};
