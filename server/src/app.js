const express = require('express')
const cors = require('cors')

const app = express()


app.use(cors({
    origin: 'http://localhost:5173', // Vite default port
    credentials: true // Allow cookies to be sent
}))



module.exports = app