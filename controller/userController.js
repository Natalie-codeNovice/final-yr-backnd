const db = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

// create main model
const User = db.users;

// main work
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

        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            phoneNumber
        });

        res.status(201).json({
            message: 'User created successfully!',
            user
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

// login user and generate JWT token
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find the user by their username
        const user = await User.findOne({ where: { email } });

        if (!user) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        // Compare the provided password with the hashed password in the database
        if (bcrypt.compareSync(password, user.password)) {
            // Passwords match, generate a JWT token using your actual secret key
            const token = jwt.sign({ userId: user.id }, 'qwe1234', { expiresIn: '1h' });

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
            res.status(401).json({ message: 'Incorrect email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Login failed' });
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

module.exports = {
    addUser,
    loginUser,
    getOneUser,
    updateUser,
    deleteUser,
    updatePassword, // Export the new function
};

