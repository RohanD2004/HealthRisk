const express= require("express");
const dotenv=require("dotenv").config();
const router =require("./routes/routes")
const app=express();
const session = require("express-session");
const cors = require('cors');


// Add this near the top of your server file (before your routes)
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

//Middleware
app.use(express.json());

//Api routs
app.use('/',router)

//server

const PORT= process.env.APP_PORT || 8002;

app.listen(PORT,()=>{
    console.log("Server running on the "+PORT);
})




