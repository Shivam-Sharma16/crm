require('dotenv').config()
const app = require('./src/app')

const cors = require('cors');
app.use(cors({
    origin: ["https://crm-ebon-two.vercel.app/"], // Your Vercel Domain
    methods: ["POST", "GET"],
    credentials: true
}));

const PORT = process.env.PORT || 3000


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})