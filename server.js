const express = require('express');
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const APP_PORT = process.env.PORT || 3000;
const APP_URL = process.env.URL || `http://localhost:${APP_PORT}`;

const { readFile } = require('fs').promises;

const ACTIONS = {
    LOGIN:          "login",
    SIGN_UP:        "sign_up",    
    ADMIN:          "admin",
    UPDATE_DEFINES: "update_def",
    OPEN_DOOR:      "open_door",
    UPDATE_DATA:    "update_data", 
    AUTHENTICATION: "authentication",
};


app.use(express.static('public'));

//GET root
app.get('/', async(request, response) => {
    response.send(await readFile('./public/index.html', 'utf-8'));
});


//GET homepage
app.get('/home', async(request, response) => {
    response.send(await readFile('./public/home.html', 'utf-8'));
});


//Server listening on APP_PORT (3000)
server.listen(APP_PORT, () => console.log(`App Available on ${APP_URL}`));


//Connection to Web Socket Server 
wss.on("connection", (ws) => {
        console.log("Client connected to server!");

    ws.on("close", () => {
        console.log("Client disconnected from server!");
    })        

    ws.on("message", handleIncomingMsg.bind(null, ws));
});


function handleIncomingMsg(ws, msg){

    const data = JSON.parse(msg); 
    const action = data.action;

    switch(action){
        // (?)
        case ACTIONS.ADMIN:
            //ws.isAdmin = true;
            break;

        //client -> rasp
        case ACTIONS.LOGIN:
            handleLogin(data.user, data.pass);
            break;
        
        //client -> rasp
        case ACTIONS.SIGN_UP:
            handleSignUp(data.name, data.user, data.pass);
            break;

        //client -> rasp
        case ACTIONS.OPEN_DOOR:
            handleDoor(data.door_signal);
            break;

        //rasp -> client
        case ACTIONS.UPDATE_DATA:
            handleUpdateData(data.light_state, data.water_sensor, data.temp_sensor, data.a_hum_sens, data.s_hum_sens);
            break;

        //client -> rasp
        case ACTIONS.UPDATE_DEFINES:
            handleUpdateDefines(data.temperature, data.air_humidity, data.soil_humidity, data.light_def);    
            break;

        //rasp -> client
        case ACTIONS.AUTHENTICATION:
            //handleAuthentication(data.token);
            break;

        default:
            console.warn("Action Unknowned! -> ", action);
            break;
    }

}

function handleLogin(login_name, login_pass){

    console.log("*************************");
    console.log(" LOGIN NAME -> ", login_name);
    console.log(" LOGIN PASS -> ", login_pass);
    console.log("*************************");

    //send credentials to rasp
    

}

function handleSignUp(sign_name, sign_user, sign_pass){

    console.log("*************************");
    console.log(" SIGN UP NAME -> ", sign_name);
    console.log(" SIGN UP USER -> ", sign_user);
    console.log(" SIGN UP PASS -> ", sign_pass);
    console.log("*************************");

    //send credentials to rasp

}

function handleDoor(signal){

    console.log("*************************");
    console.log(" Door Signal -> ", signal);
    console.log("*************************");

    //Send signal to rasp
};


function handleUpdateDefines(temp_def, a_hum_def, s_hum_def, light_define){

    const temp = temp_def;
    const air_hum = a_hum_def;
    const soil_hum = s_hum_def;
    const light = light_define;
    

    console.log("***** Define Values *****");
    console.log("  Temperature   -> ", temp);
    console.log("  Air Humidity  -> ", air_hum);
    console.log("  Soil Humidity -> ", soil_hum);
    console.log("  Light         -> ", light);
    console.log("*************************");

    //Send data to rasp

};

            