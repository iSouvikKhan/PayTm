const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
// place all such middlewares above the first route because order does matters here

const mainRouter = require("./routes/index");



app.use("/api/v1", mainRouter);
// app.use() is used to create middlewares or run middlewares before function
// it is also used to route request that start from a certain substring over to another router
// all requests that are coming here - "/api/v1" will go here - mainRouter

app.listen(3000, function(err){
    if(err){
        console.log("mayday...mayday", err);
    }else{
        console.log("Listening at port 3000");
    }
})