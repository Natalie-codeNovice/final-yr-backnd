const db = require("../../models");
const nodemailer = require('nodemailer');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.USER_PASS
    }
});

// Route to handle form submission
const sendEmail = async (req, res) => {
    const recipientEmail = req.body.email || null;
    const subject = req.body.subject;
    const message = req.body.message;

    // Email options
    const mailOptions = {
        from: 'Personal Finance Tracker <no-reply@personalfinancetracker.com>',
        subject: subject,
        text: message,
        html: `<p>${message}</p>`
    };

    if (recipientEmail) {
        mailOptions.to = recipientEmail;
        
        // Send email to specified recipient
        try {
            await transporter.sendMail(mailOptions);
            console.log('Email sent to:', recipientEmail);
            res.send('Email sent successfully');
        } catch (error) {
            console.error('Error sending email:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        // Fetch users with role 'user' from the database using Sequelize
        try {
            const users = await db.users.findAll({
                attributes: ['email'],
                where: {
                    role: 'user'
                }
            });

            if (users.length === 0) {
                return res.send('No users with the role "user" found');
            }

            for (let user of users) {
                mailOptions.to = user.email;
                try {
                    await transporter.sendMail(mailOptions);
                    console.log('Email sent to:', user.email);
                } catch (error) {
                    console.error('Error sending email to:', user.email, error);
                }
            }

            res.send('Emails sent to all users');
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).send('Internal Server Error');
        }
    }
};

module.exports = {
    sendEmail
};
