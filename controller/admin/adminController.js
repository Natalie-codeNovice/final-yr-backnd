const db = require('../../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); 
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
        const role = "admin";
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

        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a unique verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create the user with verification status and token
        const user = await User.create({
            username,
            email,
            role,
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
            <p>If you have any issues or did not receive the verification email, you can email us directly for assistance:</p>
            <p><a href="mailto:support@yourdomain.com?subject=Email Verification Assistance&body=Dear Support Team,%0A%0AI am having trouble verifying my email. Please assist me.%0A%0AThank you.">Contact Support</a></p>
            <p>If you did not register, please ignore this email.</p>
        `;
        sendNotificationEmail(user, 'Email Verification', 'Please verify your email address', emailContent);
        

        res.status(201).json({
            message: 'User created successfully! Please check your email to verify your account.',
            user: { id: user.id, username: user.username, email: user.email, phoneNumber: user.phoneNumber }
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
module.exports = {
    addUser,
    verifyEmail
};