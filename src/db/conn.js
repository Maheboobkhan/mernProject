const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URL)
.then(() => {
    console.log("Connected successfully");
})
.catch((err) => {
    console.log("NO Connection");
})