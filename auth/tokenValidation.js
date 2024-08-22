const { verify } = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

module.exports = {
    checkToken: (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1];

        if (token) {
            verify(token, jwtSecret, (err, decoded) => {
                if (err) {
                    console.error("Token verification error:", err);
                    return res.status(401).json({ message: "Invalid token" });
                } else {
                    req.user = decoded; // Attach decoded token info (including userId) to request object
                    next();
                }
            });
        } else {
            console.log("Token not found");
            res.status(401).json({ message: "Access denied! Unauthorized user" });
        }
    }
};
