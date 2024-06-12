//const WS_URL = "ws://localhost:5000";
const WS_URL = "ws://192.168.1.73:5000";
//const WS_URL = "ws://172.26.55.88:5000";

const HOME_PAGE_URL = "http://192.168.1.73:5000/home.html";
//const HOME_PAGE_URL = "http://172.26.55.88:5000/home.html";

const ACTIONS = {
    LOGIN:          "login",
    SIGN_UP:        "sign_up", 
    UPDATE_DEFINES: "update_def",
    OPEN_DOOR:      "open_door",
    UPDATE_DATA:    "update_data", 
    AUTHENTICATION: "authentication",
    CONNECTION:     "connection",
};

//Temperature threshold -> send warning
const MAX_TEMP = 35;

//Values Range
const max_temp = 30;
const min_temp = 15; 

const max_air_h = 90;
const min_air_h = 20;

const max_soil = 80;
const min_soil = 20;

//Regular
const temp_regular = "20";
const a_hum_regular = "50";
const s_hum_regular = "50";

//Arid
const temp_arid = "17";
const a_hum_arid = "35";
const s_hum_arid = "40";

//tropical
const temp_tropical = "25";
const a_hum_tropical = "70";
const s_hum_tropical = "70";

let light;

//MAX SAMPLES SHOWN ON APP GRAPHICS
const MAX_SAMPLES = 20;

//SENSORS_DATA

const water_graph = [];

//temperature data for graph
const temp_data = {
    categories: [],
    data: []
};

//air humidity data for graph
const a_hum_data = {
    categories: [],
    data: []
};

//soil humidity data for graph
const s_hum_data = {
    categories: [],
    data: []
};

let socket;

function connectWebSocket(){
    socket = new WebSocket(WS_URL);

    socket.addEventListener("open", handleSocketOpen);
    socket.addEventListener("error", handleSocketError);
    socket.addEventListener("message", handleSocketMsg);
    socket.addEventListener("close", handleSocketClose);
}

function handleSocketOpen(){
    //CONNECTED SYMBOL
    block_div('connected');
    hide_div('disconnected');

    console.log("WebSocket connected!");

    const dataJSON = JSON.stringify({
        action: ACTIONS.CONNECTION,
        type: "html"});

    socket.send(dataJSON);
}

function handleSocketError(error){
    console.error("WebSocket Error: ", error);
}

function handleSocketMsg(event){
    const data = JSON.parse(event.data);
    const action = data.action;

    switch(action){
        case ACTIONS.AUTHENTICATION:
            handleClientAuth(data.name);
            break;

        case ACTIONS.UPDATE_DATA:
            handleUpdateData(data.time, data.temperature, data.air_humidity, data.soil_humidity, data.light_sens, data.water);
            break;

        default:
            console.warn("Action Unknowned! -> ", action);
            break;
    }
}

function handleSocketClose(){

    //DISCONNECTED SYMBOL
    block_div('disconnected');
    hide_div('connected');
    

    console.log("WebSocket closed! Trying to reconnect in 5s...");
    setTimeout(connectWebSocket(), 5000);
}

connectWebSocket();

//-------------------------------------------------------------------------------
//handle functions for server -> client comms
function handleClientAuth(login_name){
    
    console.log("Hello: ", login_name);

    window.location.href = HOME_PAGE_URL;
}

//update sensors values
function handleUpdateData(timestamp, sensor_temp, sensor_a_hum, sensor_s_hum, sensor_light, sensor_water){

    const time = timestamp;
    const temperature = parseFloat(sensor_temp.trim());
    const air_hum = parseFloat(sensor_a_hum);
    const soil_hum = parseFloat(sensor_s_hum);
    const water = parseFloat(sensor_water);

    //Update sensors arrays
    temp_data.data.push(temperature);
    temp_data.categories.push(time);
    
    a_hum_data.data.push(air_hum);
    a_hum_data.categories.push(time);
    
    s_hum_data.data.push(soil_hum);
    s_hum_data.categories.push(time);
    
    water_graph.push(water);

    //shift after reaching max_value
    if(water_graph.length > 1){
        water_graph.shift();
    }

    if(temp_data.data.length > MAX_SAMPLES){

        temp_data.data.shift();
        temp_data.categories.shift();
        
        a_hum_data.data.shift();
        a_hum_data.categories.shift();
        
        s_hum_data.data.shift();
        s_hum_data.categories.shift();
    }
    
    //LIGHTS
    var div1 = document.getElementById('on_signal');
    var div2 = document.getElementById('off_signal');

    if (sensor_light === "OFF") {
        div2.style.display = "block";
        div1.style.display = "none";
    } else {
        div2.style.display = "none";
        div1.style.display = "block";
    }


    //Error handling -> MAX TEMP 
    if(temperature >= MAX_TEMP){
        console.log("WARNING MAX_TEMP REACHED!");
        block_div('max_temp');
    } else {
        hide_div('max_temp');
    }

    //update data on GUI
    viewData();
}

//-------------------------------------------------------------------------------
// STATIC FUNCTIONS -> WEB APP

/* HIDE/SHOW function */
function mostrarDiv(id) {

    // Esconde todas as divs da classe selectDiv
    var divs = document.getElementsByClassName("selectDiv");

    for (var i = 0; i < divs.length; i++) {
      divs[i].style.display = "none";
    }

    // Mostra a div específica
    var div = document.getElementById(id);
    if (div) {
      div.style.display = "block";
    }
}

function mostrarGraph(id) {
    // Mostra a div específica
    var div = document.getElementById(id);

    if (div.style.display == "block") {
      div.style.display = "none";
    } else {
      div.style.display = "block";
    }
}


function showData() {
    /* HIDE/SHOW function */
    mostrarGraph('graph_container');

    viewData();
}

function viewData() {

    //showLight(light);

    /*----------------------------------------WATER LEVEL---------------------------------*/

    Highcharts.chart('water_graph_container',
    {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Water Tank Level'
        },
        subtitle: {
           text: ''
        },
        xAxis:{
            categories: ['']
        },
        yAxis: {
            title: {
                text: 'Water Level (%)'
            }
        },
        series: [{
            name: 'Water',
            data: water_graph
        }
      ]       
    });

    /*----------------------------------------TEMPERATURE---------------------------------*/ 
    Highcharts.chart('temp_graph_container',
    {  
        chart: {
            type: 'line'
        },
        title: {
            text: 'Latest Average Temperature Values'
        },
        subtitle: {
           text: ''
        },
        xAxis: {
            categories: temp_data.categories
        },
        yAxis: {
            title: {
                text: 'Temperature (°C)'
            }
        },
        series: [{
            name: 'Greenhouse_Temp',
            data: temp_data.data
        }
      ]       
    });

    /*----------------------------------------AIR HUMIDITY---------------------------------*/
    Highcharts.chart('air_h_graph_container',
    {  
        chart: {
            type: 'line'
        },
        title: {
            text: 'Latest Average Air Humidity Values'
        },
        subtitle: {
           text: ''
        },
        xAxis: {
            categories: a_hum_data.categories
        },
        yAxis: {
            title: {
                text: 'Air Humidity (%)'
            }
        },
        series: [{
            name: 'Greenhouse_Air_Hum',
            data: a_hum_data.data,
            color: 'red'
        },
      ]   
    });

    /*----------------------------------------SOIL HUMIDITY---------------------------------*/
    Highcharts.chart('soil_h_graph_container',
    { 
        chart: {
            type: 'line'
        },
        title: {
            text: 'Latest Average Soil Humidity Values'
        },
        subtitle: {
           text: ''
        },
        xAxis: {
            categories: s_hum_data.categories
        },
        yAxis: {
            title: {
                text: 'Soil Humidity (%)'
            }
        },
        series: [{
            name: 'Greenhouse_Soil_Hum',
            data: s_hum_data.data,
            color: 'green'
        }
      ]       
    });
}

function sendCustomData(){
    var txt_temp = document.getElementById('temp');
    var txt_a_hum = document.getElementById('a_hum');
    var txt_s_hum = document.getElementById('s_hum');

    let light_checkbox = document.querySelector("#light_custom");

    const temp_define = txt_temp.value;
    const a_hum_define = txt_a_hum.value;
    const s_hum_define = txt_s_hum.value;
    //var light;

    let valid_temp = false;
    let valid_a_hum = false;
    let valid_s_hum = false;

    //TEMPERATURE
    if(!isNaN(txt_temp.value) &&  txt_temp.value < max_temp && txt_temp.value > min_temp) {
        console.log("Valores Temp validos");
        //console.log(temp_define);
        valid_temp = true;
    } else  {
        console.log("Temperatura inserida invalida");
    }

    //AIR HUMIDITY
    if(!isNaN(txt_a_hum.value) &&  txt_a_hum.value < max_air_h && txt_a_hum.value > min_air_h) {
        console.log("Valores Humidade do Ar validos");
        //console.log(txt_a_hum.value);
        valid_a_hum = true;
    } else  {
        console.log("Humidade do Ar inserida invalida");
    }

    //AIR HUMIDITY
    if(!isNaN(txt_s_hum.value) &&  txt_s_hum.value < max_soil && txt_s_hum.value > min_soil) {
        console.log("Valores Humidade do Solo validos");
        //console.log(txt_s_hum.value);
        valid_s_hum = true;
    } else  {
        console.log("Humidade do Solo inserida invalida");
    }  

    //LIGHT
    if(light_checkbox.checked){
        console.log("Luzes -> ON");
        light = "ON";
    } else {
        console.log("Luzes -> OFF");
        light = "OFF"
    }


    //Send warning
    if(!(valid_temp && valid_a_hum && valid_s_hum)){
        show_div('warning');
        hide_div('check');
    }

    //Send custom data via websocket if define values are in the allowed range
    if(valid_temp && valid_a_hum && valid_s_hum){

        //Hide Warning
        hide_div('warning');
        show_div('check');

        const dataJSON = JSON.stringify({
            action: ACTIONS.UPDATE_DEFINES,
            temperature: temp_define, 
            air_humidity: a_hum_define, 
            soil_humidity: s_hum_define, 
            light_def: light});

        socket.send(dataJSON);
    };
}

function sendData_regular(){

    //get checkbox info
    let light_checkbox = document.querySelector("#light_regular");

    //LIGHT
    if(light_checkbox.checked){
        console.log("Luzes -> ON");
        light = "ON";
    } else {
        console.log("Luzes -> OFF");
        light = "OFF";
    }

    show_div('check');

    const dataJSON = JSON.stringify({
        action: ACTIONS.UPDATE_DEFINES,
        temperature: temp_regular, 
        air_humidity: a_hum_regular, 
        soil_humidity: s_hum_regular, 
        light_def: light});

    socket.send(dataJSON);    
}

function sendData_arid(){

    let light_checkbox = document.querySelector("#light_arid");

    //LIGHT
    if(light_checkbox.checked){
        console.log("Luzes -> ON");
        light = "ON";
    } else {
        console.log("Luzes -> OFF");
        light = "OFF";
    }

    show_div('check');

    const dataJSON = JSON.stringify({
        action: ACTIONS.UPDATE_DEFINES,
        temperature: temp_arid, 
        air_humidity: a_hum_arid , 
        soil_humidity: s_hum_arid, 
        light_def: light});

    socket.send(dataJSON);
}

function sendData_tropical(){

    let light_checkbox = document.querySelector("#light_tropical");

    //LIGHT
    if(light_checkbox.checked){
        console.log("Luzes -> ON");
        light = "ON";
    } else {
        console.log("Luzes -> OFF");
        light = "OFF";
    }

    show_div('check');

    const dataJSON = JSON.stringify({
        action: ACTIONS.UPDATE_DEFINES,
        temperature: temp_tropical, 
        air_humidity: a_hum_tropical , 
        soil_humidity: s_hum_tropical, 
        light_def: light});

    socket.send(dataJSON);
}

function open_door(){
    console.log("Door Opening...");

    const dataJSON = JSON.stringify({
        action: ACTIONS.OPEN_DOOR,
        door_signal: "OPEN"
    });

    socket.send(dataJSON);

}

function show_login_sign(id) {

    // Esconde todas as divs da classe selectDiv
    var divs = document.getElementsByClassName("login_sign");

    for (var i = 0; i < divs.length; i++) {
      divs[i].style.display = "none";
    }

    // Mostra a div específica
    var div = document.getElementById(id);
    if (div) {
      div.style.display = "block";
    }
}

function login() {

    var username_txt = document.getElementById('login_user');
    var password_txt = document.getElementById('login_pass');

    const username = username_txt.value;
    const password = password_txt.value;


    const dataJSON = JSON.stringify({
        action: ACTIONS.LOGIN,
        user: username, 
        pass: password
    });

    socket.send(dataJSON);
}

function sign_up(){

    var sign_name_txt = document.getElementById('sign_name');
    var username_txt = document.getElementById('sign_user');
    var password_txt = document.getElementById('sign_pass');

    const sign_name = sign_name_txt.value;
    const username = username_txt.value;
    const password = password_txt.value;

    const dataJSON = JSON.stringify({
        action: ACTIONS.SIGN_UP,
        name: sign_name, 
        user: username,
        pass: password
        });

    socket.send(dataJSON); 
}

function show_div(id){
    var div = document.getElementById(id);

    div.style.display = "block";

    setTimeout(function() {
        div.style.display = 'none'; // After timeout clear div
      }, 5000);
}

function hide_div(id){
    var div = document.getElementById(id);

    div.style.display = "none";
}

function block_div(id){
    var div = document.getElementById(id);

    div.style.display = "block";
}