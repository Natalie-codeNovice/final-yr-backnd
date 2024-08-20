// auth/authorization.js

module.exports = {
    authorizeUser: (req, res, next) => {
        const userId = req.user.userId;
        const id = req.params.id;

        if (String(userId) !== String(id)) {
            return res.status(403).json({ message: 'Access denied. You cannot view this user.' });
        }

        next(); // Proceed to the next middleware or route handler if the check passes
    }
};
