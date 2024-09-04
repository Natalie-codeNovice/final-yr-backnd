const db = require('../models');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');

// Set up email transport
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

const handleExpense = async (res, userId, amount, categoryName) => {
    let netBalance = await db.netBalances.findOne({ where: { userId } });
    if (netBalance) {
        let category = await db.categories.findOne({ 
            where: { 
                categoryName, 
                userId,  
                isValid: true 
            } 
        });
    let user = await db.users.findOne({where: {id:userId}});    
        if (category) {
            const parsedAmount = parseFloat(amount);
            if (parsedAmount > parseFloat(category.remainedAmount)) {
                return res.status(403).json({ message: "Exceeded limit" }); // Return immediately to prevent further processing
            }
            let usageAmount = parseFloat(category.usageAmount);
            usageAmount += parsedAmount;
            category.usageAmount = usageAmount;
            category.remainedAmount -= parsedAmount;
            const limitAmount = parseFloat(category.limitAmount);
            await category.save();
            
            let percentage = (usageAmount * 100) / limitAmount;
            let subject = "";
            let text = "";

            // Log the percentage at 50%, 80%, and 100% thresholds only once
            if (percentage >= 50 && percentage < 80 && !category.logged50) {
                subject = "Usage Alert: 50% of Your Budget Reached";
                text = `You have used ${percentage}% of your budget for ${category.categoryName}. Your limit is ${category.limitAmount}RWF and you have used ${category.usageAmount}RWF. Please review your expenses to ensure they align with your financial goals.`;
                category.logged50 = true; // Mark as logged
            } else if (percentage >= 80 && percentage < 100 && !category.logged80) {
                subject = "Urgent Alert: 80% of Your Budget Reached";
                text = `You have used ${percentage}% of your budget for ${category.categoryName}. Your limit is ${category.limitAmount}RWF and you have used ${category.usageAmount}RWF.  Consider revising your spending to avoid exceeding your limit.`;
                category.logged80 = true; // Mark as logged
            } else if (percentage === 100 && !category.logged100) {
                subject = "Critical Alert: 100% of Your Budget Used";
                text = `You have reached 100% of your budget for ${category.categoryName}. No more funds are available in this category. Please adjust your spending immediately.`;
                category.logged100 = true; // Mark as logged
            }

            await category.save();

            // Send notification email
            if(subject){
                sendNotificationEmail(
                    user,
                    subject,
                    `Dear ${user.username}, ${text}`,
                    `<p>Dear ${user.username},</p><p>${text}</p>`
                );
            }

            
            
            
        }
        netBalance.balance -= parseFloat(amount);
        await netBalance.save();
    }
    return true;
};


// Function to handle income transaction
const handleIncome = async (userId, amount) => {
    let netBalance = await db.netBalances.findOne({ where: { userId } });
    if (!netBalance) {
        netBalance = await db.netBalances.create({ balance: amount, userId });
    } else {
        netBalance.balance += parseFloat(amount);
        await netBalance.save();
    }
  };


// Function to handle saving transaction
const handleSaving = async (userId, amount, transactionId, usageDate) => {
    let netBalance = await db.netBalances.findOne({ where: { userId } });
    if (netBalance) {
      netBalance.balance -= parseFloat(amount);
      await netBalance.save();

      await db.savings.create({
        amount,
        usageDate, 
        transactionId
      });
    }
  };  

// Create a new transaction
const createTransaction = async (req, res) => {
    let userId = req.params.id;
  const { description, amount, type, category, usageDate } = req.body;
  try {
      let netBalance = await db.netBalances.findOne({ where: { userId } });

      // Handle transaction based on type
      if (type === 'income') {
          const transaction = await db.transactions.create({
              description,
              amount,
              type,
              category,
              userId
          });
          await handleIncome(userId, amount);
          res.status(201).json({ message: 'Transaction added successfully', transaction });

      } else if (type === 'expense') {
        if (!netBalance) {
            return res.status(200).json({ message: "Add income first" });
        } else if (netBalance.balance < parseFloat(amount)) {
            return res.status(200).json({ message: "Insufficient Balance" });
        } else {
            // Validate and handle the expense before saving the transaction
            const expenseHandled = await handleExpense(res, userId, amount, category);
            if (expenseHandled !== true) {
                return; // If the expense was not handled (e.g., limit exceeded), return early
            }

            // Now that the expense is validated, create the transaction
            const transaction = await db.transactions.create({
                description,
                amount,
                type,
                category,
                userId
            });

            res.status(201).json({ message: 'Transaction added successfully', transaction });
        }

    } else if (type === 'saving') {
          if (!netBalance) {
              res.status(200).json({ message: "Add income first" });
          } else if (netBalance.balance < parseFloat(amount)) {
              res.status(200).json({ message: "Insufficient Balance" });
          } else {
              const transaction = await db.transactions.create({
                  description,
                  amount,
                  type,
                  category,
                  userId
              });
              await handleSaving(userId, amount, transaction.id, usageDate);
              res.status(201).json({ message: 'Transaction added successfully', transaction });
          }
      }

  } catch (error) {
        console.error('Error adding transaction:', error); // Log the error details
      res.status(500).json({ message: 'Error adding transaction', error });
  }
};


  // Retrieve transactions for a user
const getUserTransactions = async (req, res) => {
    let userId = req.params.id;
    try {
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      const transactions = await db.transactions.findAll({ where: { userId } });
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error retrieving transactions:', error);
      res.status(500).json({ message: 'Error retrieving transactions', error: error.message || error });
    }
  };

// Delete a transaction
const deleteTransaction = async (req, res) => {
    try {
        let userId = req.params.id;      
        const deletedCount = await db.transactions.destroy({ where: { userId} });
        if (deletedCount > 0) {
            res.status(200).send('Transaction is deleted');
        } else {
            res.status(404).send('Transaction not found');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).send('Error deleting transaction');
    }
};




// Function to generate daily report for the current day
const generateDailyTransactionsReport = async (req, res) => {
    const userId = req.params.id;
    const today = new Date();
    const dayStart = new Date(today.setHours(0, 0, 0, 0));
    const dayEnd = new Date(today.setHours(23, 59, 59, 999));

    try {
        const transactions = await db.transactions.findAll({
            where: {
                userId,
                createdAt: {
                    [Op.gte]: dayStart,
                    [Op.lte]: dayEnd
                }
            }
        });


        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalSavings = transactions.filter(t => t.type === 'saving').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const netBalance = totalIncome - (totalExpenses + totalSavings);
        res.status(200).json({
            transactions,
            totalIncome,
            totalSavings,
            totalExpenses,
            netBalance
        });
    } catch (error) {
        console.error('Error generating daily report:', error);
        res.status(500).json({ message: 'Error generating daily report', error });
    }
};

const generateWeeklyTransactionsReport = async (req, res) => {
    const userId = req.params.id;
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); 
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - diffToMonday));
    firstDayOfWeek.setHours(0, 0, 0, 0);
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    try {
        const transactions = await db.transactions.findAll({
            where: {
                userId,
                createdAt: {
                    [Op.gte]: firstDayOfWeek,
                    [Op.lte]: lastDayOfWeek
                }
            }
        });


        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalSavings = transactions.filter(t => t.type === 'saving').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const netBalance = totalIncome - (totalExpenses + totalSavings);
        res.status(200).json({
            transactions,
            totalIncome,
            totalSavings,
            totalExpenses,
            netBalance
        });
    } catch (error) {
        console.error('Error generating weekly report:', error);
        res.status(500).json({ message: 'Error generating weekly report', error });
    }
};


// Function to generate monthly report for the current month
const generateMonthlyTransactionsReport = async (req, res) => {
    const userId = req.params.id;
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    try {
        const transactions = await db.transactions.findAll({
            where: {
                userId,
                createdAt: {
                    [Op.gte]: firstDayOfMonth,
                    [Op.lte]: lastDayOfMonth
                }
            }
        });


        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalSavings = transactions.filter(t => t.type === 'saving').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const netBalance = totalIncome - (totalExpenses + totalSavings);
        res.status(200).json({
            transactions,
            totalIncome,
            totalSavings,
            totalExpenses,
            netBalance
        });
    } catch (error) {
        console.error('Error generating monthly report:', error);
        res.status(500).json({ message: 'Error generating monthly report', error });
    }
};


// Function to generate customizable report for a specified date range and net balance within the range
const generateCustomTransactionsReportWithNetBalance = async (req, res) => {
    const userId = req.params.id;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    try {
        const transactions = await db.transactions.findAll({
            where: {
                userId,
                createdAt: {
                    [Op.gte]: start,
                    [Op.lte]: end
                }
            }
        });

        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalSavings = transactions.filter(t => t.type === 'saving').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const netBalance = totalIncome - (totalExpenses + totalSavings);

        res.status(200).json({
            transactions,
            totalIncome,
            totalSavings,
            totalExpenses,
            netBalance
        });
    } catch (error) {
        console.error('Error generating custom report with net balance:', error);
        res.status(500).json({ message: 'Error generating custom report with net balance', error });
    }
};

// Function to generate weekly report with daily breakdown
const generateWeeklyReport = async (req, res) => {
    const userId = req.params.id;
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - diffToMonday));
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const dailyBreakdown = [];
    const categoryBreakdown = {
        income: {},
        savings: {},
        expenses: {},
    };

    try {
        for (let i = 0; i < 7; i++) {
            const startOfDay = new Date(firstDayOfWeek);
            startOfDay.setDate(firstDayOfWeek.getDate() + i);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(startOfDay);
            endOfDay.setHours(23, 59, 59, 999);

            const transactions = await db.transactions.findAll({
                where: {
                    userId,
                    createdAt: {
                        [Op.gte]: startOfDay,
                        [Op.lte]: endOfDay
                    }
                }
            });

            const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => {
                categoryBreakdown.income[t.category] = (categoryBreakdown.income[t.category] || 0) + parseFloat(t.amount);
                return sum + parseFloat(t.amount);
            }, 0);

            const totalSavings = transactions.filter(t => t.type === 'saving').reduce((sum, t) => {
                categoryBreakdown.savings[t.category] = (categoryBreakdown.savings[t.category] || 0) + parseFloat(t.amount);
                return sum + parseFloat(t.amount);
            }, 0);

            const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => {
                categoryBreakdown.expenses[t.category] = (categoryBreakdown.expenses[t.category] || 0) + parseFloat(t.amount);
                return sum + parseFloat(t.amount);
            }, 0);

            dailyBreakdown.push({
                day: startOfDay.toDateString(),
                totalIncome,
                totalSavings,
                totalExpenses
            });
        }

        res.status(200).json({ dailyBreakdown, categoryBreakdown });
    } catch (error) {
        console.error('Error generating weekly report:', error);
        res.status(500).json({ message: 'Error generating weekly report', error });
    }
};

// Function to generate monthly report with weekly breakdown
const generateMonthlyReport = async (req, res) => {
    const userId = req.params.id;
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const weeklyBreakdown = [];
    const categoryBreakdown = {
        income: {},
        savings: {},
        expenses: {},
    };

    try {
        let startOfWeek = new Date(firstDayOfMonth);

        while (startOfWeek <= lastDayOfMonth) {
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const transactions = await db.transactions.findAll({
                where: {
                    userId,
                    createdAt: {
                        [Op.gte]: startOfWeek,
                        [Op.lte]: endOfWeek
                    }
                }
            });

            const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => {
                categoryBreakdown.income[t.category] = (categoryBreakdown.income[t.category] || 0) + parseFloat(t.amount);
                return sum + parseFloat(t.amount);
            }, 0);

            const totalSavings = transactions.filter(t => t.type === 'saving').reduce((sum, t) => {
                categoryBreakdown.savings[t.category] = (categoryBreakdown.savings[t.category] || 0) + parseFloat(t.amount);
                return sum + parseFloat(t.amount);
            }, 0);

            const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => {
                categoryBreakdown.expenses[t.category] = (categoryBreakdown.expenses[t.category] || 0) + parseFloat(t.amount);
                return sum + parseFloat(t.amount);
            }, 0);

            weeklyBreakdown.push({
                week: `${startOfWeek.toDateString()} - ${endOfWeek.toDateString()}`,
                totalIncome,
                totalSavings,
                totalExpenses
            });

            startOfWeek.setDate(startOfWeek.getDate() + 7);
        }

        res.status(200).json({ weeklyBreakdown, categoryBreakdown });
    } catch (error) {
        console.error('Error generating monthly report:', error);
        res.status(500).json({ message: 'Error generating monthly report', error });
    }
};

// Function to generate daily report
const generateDayReport = async (req, res) => {
    const userId = req.params.id;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    try {
        // Fetch transactions for the day
        const transactions = await db.transactions.findAll({
            where: {
                userId,
                createdAt: {
                    [Op.between]: [startOfDay, endOfDay],
                },
            },
        });

        // Initialize report structure
        const dailyBreakdown = {
            totalIncome: 0,
            totalSavings: 0,
            totalExpenses: 0,
            categoryBreakdown: {
                income: {},
                savings: {},
                expenses: {},
            },
        };

        // Process transactions to calculate totals and category breakdown
        transactions.forEach(transaction => {
            const { amount, type, category } = transaction;
            const parsedAmount = parseFloat(amount);

            switch (type) {
                case 'income':
                    dailyBreakdown.totalIncome += parsedAmount;
                    dailyBreakdown.categoryBreakdown.income[category] = (dailyBreakdown.categoryBreakdown.income[category] || 0) + parsedAmount;
                    break;
                case 'saving':
                    dailyBreakdown.totalSavings += parsedAmount;
                    dailyBreakdown.categoryBreakdown.savings[category] = (dailyBreakdown.categoryBreakdown.savings[category] || 0) + parsedAmount;
                    break;
                case 'expense':
                    dailyBreakdown.totalExpenses += parsedAmount;
                    dailyBreakdown.categoryBreakdown.expenses[category] = (dailyBreakdown.categoryBreakdown.expenses[category] || 0) + parsedAmount;
                    break;
                default:
                    break;
            }
        });

        // Send response with daily report
        res.status(200).json(dailyBreakdown);
    } catch (error) {
        console.error('Error generating daily report:', error);
        res.status(500).json({ message: 'Error generating daily report', error });
    }
};

module.exports = {
    createTransaction,
    deleteTransaction,
    getUserTransactions,
    generateDailyTransactionsReport,
    generateWeeklyTransactionsReport,
    generateMonthlyTransactionsReport,
    generateCustomTransactionsReportWithNetBalance,
    generateWeeklyReport,
    generateMonthlyReport,
    generateDayReport
};
