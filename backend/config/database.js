const dotenv = require('dotenv').config();
const express = require("express");
const app = express();
const mongoose = require('mongoose');


var MONGODB_URI = process.env.MONGODB_URI;
var PORT = process.env.PORT
mongoose.connect(MONGODB_URI).then(()=>{
    console.log('connected to MongoDB local ');
    //to  app.js

    
})
.catch((err)=>{
    console.error('error connecting to mongodb local',err)
})

module.exports = app;