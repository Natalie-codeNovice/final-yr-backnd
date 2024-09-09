const db = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); 
const emailExistence = require('email-existence');
const jwtSecret = process.env.JWT_SECRET;
// create main model
const User = db.users;

// main work

//Set up email transport
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



// 1. create user
const addUser = async (req, res) => {
    try {
        const { username, email, password, phoneNumber } = req.body;

        // Basic validation
        if (!username || !email || !password || !phoneNumber) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check for existing user
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username },
                    { email },
                    { phoneNumber }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already exists.' });
            }
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already exists.' });
            }
            if (existingUser.phoneNumber === phoneNumber) {
                return res.status(400).json({ message: 'Phone number already exists.' });
            }
        }

        // Verify if the email address exists
        emailExistence.check(email, async (err, response) => {
            if (err || !response) {
                return res.status(400).json({ message: 'Invalid email address. Please use a valid email.' });
            }

            // Hash the password before saving it to the database
            const hashedPassword = await bcrypt.hash(password, 10);

            // Generate a unique verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');

            // Create the user with verification status and token
            const user = await User.create({
                username,
                email,
                password: hashedPassword,
                phoneNumber,
                verificationToken
            });

            // Send verification email
            const verificationLink = `https://finance-zgvt.onrender.com/verify-email?token=${verificationToken}`;
            const emailContent = `
                <p>Dear ${user.username},</p>
                <p>Thank you for registering on our platform. Please click the link below to verify your email address:</p>
                <p><a href="${verificationLink}">Verify Email</a></p>
                <p>If you did not register, please ignore this email.</p>
            `;
            sendNotificationEmail(user, 'Email Verification', 'Please verify your email address', emailContent);

            res.status(201).json({
                message: 'User created successfully! Please check your email to verify your account.',
                user: { id: user.id, username: user.username, email: user.email, phoneNumber: user.phoneNumber }
            });
        });
    } catch (error) {
        console.error("Error creating user:", error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Unique constraint error: ' + error.errors.map(e => e.message).join(', ') });
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation error: ' + error.errors.map(e => e.message).join(', ') });
        }

        res.status(500).json({ message: 'User creation failed due to an unexpected error.' });
    }
};



const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        // Find the user by the verification token
        const user = await User.findOne({ where: { verificationToken: token } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid verification token.' });
        }

        // Verify the user's email and clear the verification token
        user.isVerified = true;
        user.verificationToken = null;
        await user.save();

        return res.redirect('/emailVerified.html');
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ message: 'Error verifying email' });
    }
};


// login user and generate JWT token
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the user by their username
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if the user's email is verified
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Your email is not verified. Verify email first' });
        }

        // Compare the provided password with the hashed password in the database
        if (bcrypt.compareSync(password, user.password)) {
            // Passwords match, generate a JWT token using your actual secret key
            const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '1h' });

            // Send login notification email
            sendNotificationEmail(
                user,
                'Login Notification',
                `Dear ${user.username},\n\nYou have successfully logged in to your Personal Finance Tracker account.\n\nIf this wasn't you, please change your password immediately.`,
                `<p>Dear ${user.username},</p><p>You have successfully logged in to your <strong>Personal Finance Tracker</strong> account.</p><p>If this wasn't you, please change your password immediately.</p>`
            );

            return res
                .cookie("access_token", token, {
                    httpOnly: true,
                    secure: true
                })
                .status(200)
                .json({
                    userId: user.id,
                    username: user.username,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    token: token,
                    message: "Logged in successfully"
                });

        } else {
            // Send incorrect password notification email
            sendNotificationEmail(
                user,
                'Failed Login Attempt Notification',
                `Dear ${user.username},\n\nThere was an unsuccessful attempt to log in to your Personal Finance Tracker account with an incorrect password.\n\nIf this wasn't you, please ensure your account is secure.`,
                `<p>Dear ${user.username},</p><p>There was an unsuccessful attempt to log in to your <strong>Personal Finance Tracker</strong> account with an incorrect password.</p><p>If this wasn't you, please ensure your account is secure.</p>`
            );            
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({ message: 'Login failed due to an unexpected error.' });
    }
};


// get Single User
const getOneUser = async (req, res) => {
    try {
        let id = req.params.id;
        let user = await User.findOne({
            where: { id },
            attributes: ['username', 'email', 'phoneNumber']
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


// update user password
const updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    try {
        // Fetch the user from the database
        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify the current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Error updating password' });
    }
};
//forgot password
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a new random password
        const newPassword = crypto.randomBytes(3).toString('hex'); // Generates a 12-character password

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password in the database
        user.password = hashedNewPassword;
        await user.save();

        // Send the password reset email
        sendNotificationEmail(
            user,
            'Your New Password for Personal Finance Tracker',
            `Dear ${user.username},

We received a request to reset your password for your Personal Finance Tracker account.

Your new password is: ${newPassword}

Please use this password to log in to your account. We recommend changing your password after you log in to something more memorable and secure.

If you did not request a password reset, please ignore this email. If you need further assistance, feel free to contact our support team.

Best regards,
The Personal Finance Tracker Team
`,
            `
    <p>Dear ${user.username},</p>
    <p>We received a request to reset your password for your <strong>Personal Finance Tracker</strong> account.</p>
    <p>Your new password is: <strong>${newPassword}</strong></p>
    <p>Please use this password to log in to your account. We recommend changing your password after you log in to something more memorable and secure.</p>
    <p>If you did not request a password reset, please ignore this email. If you need further assistance, feel free to contact our support team.</p>
    <p>Best regards,<br>The Personal Finance Tracker Team</p>
    `
        );

        res.status(200).json({ message: 'New password has been sent to your email.' });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Error resetting password' });
    }
};



module.exports = {
    addUser,
    loginUser,
    getOneUser,
    updateUser,
    deleteUser,
    updatePassword,
    forgotPassword,
    verifyEmail
};