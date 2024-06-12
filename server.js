const express = require('express');
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const APP_PORT = process.env.PORT || 5000;
const APP_URL = process.env.URL || `http://localhost:${APP_PORT}`;

const { readFile } = require('fs').promises;

const ACTIONS = {
    LOGIN:          "login",
    SIGN_UP:        "sign_up",  
    UPDATE_DEFINES: "update_def",
    OPEN_DOOR:      "open_door",
    UPDATE_DATA:    "update_data", 
    AUTHENTICATION: "authentication",
    CONNECTION:     "connection",
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


//Server listening on APP_PORT 
server.listen(APP_PORT, () => console.log(`App Available on ${APP_URL}`));

let clients_html = [];
let clients_rasp = [];

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
        case ACTIONS.CONNECTION:
            handleConnection(ws, msg, data.type);
            break;

        //client -> rasp
        case ACTIONS.LOGIN:
            handleLogin(ws, msg, data.user, data.pass);
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
            handleUpdateData(data.temp, data.a_hum, data.s_hum, data.light, data.water, data.time);
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

function handleConnection(ws, msg, type){

    if(type == "html"){
        clients_html.push(ws);
        console.log("HTML client connected!");
    } else if(type == "rasp"){
        clients_rasp.push(ws);
        console.log("RASP system connected!");
    } else {
        console.log("Client undefined!");
    }
}


function handleLogin(ws, msg, login_name, login_pass){

    console.log("*************************");
    console.log(" LOGIN NAME -> ", login_name);
    console.log(" LOGIN PASS -> ", login_pass);
    console.log("*************************");


    const dataJSON = JSON.stringify({
        action: ACTIONS.AUTHENTICATION,
        name: login_name,
        pass: login_pass
    });

    //send credentials to rasp
    clients_rasp.forEach((client) => {
        client.send(dataJSON);    
    });
    
    clients_html.forEach((client) => {
        client.send(dataJSON);    
    });
}

function handleSignUp(sign_name, sign_user, sign_pass){

    console.log("*************************");
    console.log(" SIGN UP NAME -> ", sign_name);
    console.log(" SIGN UP USER -> ", sign_user);
    console.log(" SIGN UP PASS -> ", sign_pass);
    console.log("*************************");

    //send credentials to rasp
    const dataJSON = JSON.stringify({
        action: ACTIONS.SIGN_UP,
        name: sign_name,
        user: sign_user,
        pass: sign_pass
    });

    clients_rasp.forEach((client) => {
        client.send(dataJSON);    
    });
}

function handleDoor(signal){

    console.log("*************************");
    console.log(" Door Signal -> ", signal);
    console.log("*************************");

    //Send signal to rasp
    const dataJSON = JSON.stringify({
        action: ACTIONS.OPEN_DOOR,
        signal: "open"});

    clients_rasp.forEach((client) => {
        client.send(dataJSON);    
    });
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

    const dataJSON = JSON.stringify({
        action: ACTIONS.UPDATE_DEFINES,
        temperature: temp, 
        air_humidity: air_hum, 
        soil_humidity: soil_hum, 
        light_def: light});

    clients_rasp.forEach((client) => {
        client.send(dataJSON);    
    });
};

            
function handleUpdateData(timestamp, temp, a_hum, s_hum, water_level, light){

    console.log("***** Update Data *****");
    console.log("  Time -> ", timestamp);
    console.log("  Temperature   -> ", temp);
    console.log("  Air Humidity  -> ", a_hum);
    console.log("  Soil Humidity -> ", s_hum);
    console.log("  Light         -> ", light);
    console.log("  Water         -> ", water_level);
    console.log("*************************");

    const dataJSON = JSON.stringify({
        action: ACTIONS.UPDATE_DATA,
        time: timestamp,
        temperature: temp, 
        air_humidity: a_hum, 
        soil_humidity: s_hum, 
        light_sens: light,
        water: water_level,
        });

    clients_html.forEach((client) => {
        client.send(dataJSON);    
    }); 
}
