require('dotenv').config()
const express = require('express');
const socket = require('socket.io');
const mongoose = require('mongoose')
const app = express()

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'))
app.use(express.json())

const port = process.env.PORT || 3000;


const start = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        app.listen(port, () => {
            console.log(`listening on port ${port}`);
        })
    } catch (error) {
        console.log(error);
    }
}

start()