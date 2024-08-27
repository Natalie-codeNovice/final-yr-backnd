const express = require('express')
const cors = require('cors')
const cookieParser = require("cookie-parser");
const app = express()



//midleware
app.use(cookieParser());
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended:true}))

//routers
const userRoutes = require('./routes/usersRoutes.js')
const transactionRoutes = require('./routes/transactionRoutes.js')
const netBalanceRoutes = require('./routes/netBalanceRoutes.js')
const expenseRoutes = require('./routes/expenseRoutes.js')
const incomeRoutes = require('./routes/incomeRoutes.js')
const savingRoutes = require('./routes/savingRoutes.js')
app.use('/', transactionRoutes)
app.use('/', userRoutes)
app.use('/',netBalanceRoutes)
app.use('/',expenseRoutes)
app.use('/',incomeRoutes)
app.use('/',savingRoutes)

//testing api
app.get('/', (req, res) => {
    res.json({message:'hello from api'})
})


//port
const PORT = process.env.PORT || 5000


//server
app.listen(PORT, ()=> {
    console.log('server is running on port: ', PORT)
})