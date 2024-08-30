const db = require('../models');
const Category = db.categories;

const addLimit = async (req, res) => {
  try {
    const userId = req.params.id;
    const { categoryName, limitAmount, startingDate, endingDate } = req.body;
    const remainedAmount = limitAmount;

    // Check if endingDate is before startingDate
    if (new Date(endingDate) < new Date(startingDate)) {
        return res.status(400).json({ message: 'Ending date cannot be before starting date.' });
      }    
    // Check for existing category for the specific user
    const existingCategory = await Category.findOne({
      where: { categoryName, userId }
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists for this user.' });
    }
    const cat = await Category.create({
      categoryName,
      limitAmount,
      startingDate,
      endingDate,
      userId,
      remainedAmount
    });
    res.status(201).json({
      message: 'Limit added!',
      cat
    });
  } catch (error) {
    console.error("Error adding limit:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllLimits = async (req, res) => {
  try {
    const userId = req.params.id;
    const categories = await Category.findAll();
    for (const category of categories) {
      if (new Date(category.endingDate) < new Date().setHours(0, 0, 0, 0)) {
        category.isValid = false;
        await category.save();
      }
    }
    const validCategories = await Category.findAll({
      where: { userId, isValid: true },
    });

    if (validCategories.length === 0) {
      return res.status(404).json({ message: 'No valid limits found for this user.' });
    }

    // Calculate the usage percentage for each category
    const categoriesWithPercentage = validCategories.map(category => {
      const percentage = (category.usageAmount / category.limitAmount) * 100;
      return {
        ...category.toJSON(), // Convert the Sequelize model instance to a plain object
        usagePercentage: percentage.toFixed(2), // Include the percentage (fixed to 2 decimal places)
      };
    });

    res.status(200).json(categoriesWithPercentage);
  } catch (error) {
    console.error("Error retrieving limits:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
  
  module.exports = {
    addLimit,
    getAllLimits
  };
