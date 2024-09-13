const db = require('../../models');
const nodemailer = require('nodemailer');
const User = db.users;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.USER_PASS
    }
});

// Send notification email
const sendNotificationEmail = (user, subject, text, html) => {
    let mailOptions = {
        from: 'Personal Finance Tracker <no-reply@personalfinancetracker.com>',
        to: user.email,
        subject: subject,
        text: text,
        html: html
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

const getAllUsers = async (req,res) => {
    try {
        let user = await User.findAll({
            where: {role},
            attributes: ['id','username', 'email', 'phoneNumber','isVerified']
        });
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'No registered users found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};
// get Single User
const getOneUser = async (req, res) => {
    try {
        const role = "user";
        let id = req.params.id;
        let user = await User.findOne({
            where: { id, role },
            attributes: ['username', 'email', 'phoneNumber','role']
        });
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user' });
    }
};

// get Single User
const getUserSessions = async (req, res) => {
    try {
        let id = req.params.id;
        let sessions = await db.loginSessions.findAll({
            where: { userId: id },
            attributes: ['loggedInAt', 'loggedOutAt']
        });

        if (sessions.length > 0) {
            // Calculate duration for each session
            const sessionsWithDuration = sessions.map(session => {
                const loggedInAt = new Date(session.loggedInAt);
                const loggedOutAt = new Date(session.loggedOutAt);

                // Calculate duration in milliseconds
                const durationMs = loggedOutAt - loggedInAt;

                // Convert duration to minutes and seconds
                const durationMinutes = Math.floor(durationMs / 60000);
                const durationSeconds = Math.floor((durationMs % 60000) / 1000);

                return {
                    ...session.toJSON(), // Spread the existing session data
                    duration: `${durationMinutes}m ${durationSeconds}s` // Add the duration
                };
            });

            res.status(200).json(sessionsWithDuration);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user sessions' });
    }
};


// update user
const updateUser = async (req, res) => {
    let id = req.params.id;
    let user = await User.findOne({ where: { id } });
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    try {
        // Check if the new username is taken
        if (req.body.username && req.body.username !== user.username) {
            let existingUser = await User.findOne({ where: { username: req.body.username } });
            if (existingUser) {
                res.status(400).json({ message: 'Username already taken' });
                return;
            }
        }

        // Check if the new email is taken
        if (req.body.email && req.body.email !== user.email) {
            let existingUser = await User.findOne({ where: { email: req.body.email } });
            if (existingUser) {
                res.status(400).json({ message: 'Email already taken' });
                return;
            }
        }

        // Check if the new phone number is taken
        if (req.body.phoneNumber && req.body.phoneNumber !== user.phoneNumber) {
            let existingUser = await User.findOne({ where: { phoneNumber: req.body.phoneNumber } });
            if (existingUser) {
                res.status(400).json({ message: 'Phone number already taken' });
                return;
            }
        }
        // Update other user data based on req.body (e.g., username, email, phone number)
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

        // Save the updated user
        await user.save();

        res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
};

// delete any user
const deleteUser = async (req, res) => {
    try {
        let id = req.params.id;
        const deletedCount = await User.destroy({ where: { id } });
        if (deletedCount > 0) {
            res.status(200).json({ message: 'User deleted successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};
module.exports = {
    getAllUsers,
    getOneUser,
    updateUser,
    deleteUser,
    getUserSessions,
    
};