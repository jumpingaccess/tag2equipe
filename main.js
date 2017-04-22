//////////////////////////////////////////////////////////////
//// TAG2Equipe command Line Connector 
//// *********************************
////
//// This is used to make a bridge between TAG HEUER CP 540/545
//// To Equipe Software.
////
//// Functions already included:
//// ***************************
////
//// * Serial and IP Serial Connections
//// * Websocket and Secure Websocket on ws:// and wss:// 
//// * Basic Log of activity in the log folder
////
////
//// Todo
//// ******
////
//// * Web interface creation.
////
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
//// Required modules call
//////////////////////////////////////////////////////////////
const WebSocket = require('ws');
var S = require('string');
var express = require('express');
var readlineSync = require('readline-sync');
const TickTimer = require("./time-ticks.js");
var SerialPort = require('serialport');
var net = require('net');
var fs = require('fs');
var dateFormat = require('dateformat');
var now = new Date();
var dateoftheday = dateFormat(now,"ddmmyy");
var WebSocketServer = require('ws').Server;
var app = express();
var crypto = require('crypto');
var https = require("https");

//////////////////////////////////////////////////////////////
//// Required variables call
//////////////////////////////////////////////////////////////

var Portfind;
var payload_output = {
      time: null,
      previousTime: null,
      running: false,
      countDown: false,
      countDownDiff: null,
      countDownValue: null,
      waiting: false,
      faults: null,
      totalFaults: null,
      fenceFaults: null,
      timeFaults: null,
      timeAdded: null,
      id: null,
      startNo: null,
      rider: null,
      horse: null,
      round: 1,
      phase: 1,
      timeToBeatDiff: null,
      timeToBeatTime: null,
      timekeepingOutputId: null
};
var path_log = "./logs";
var ligne ="";
var httpsServer;
var wssl;
var certificate = fs.readFileSync('cert/cert.pem', 'utf8');
var privateKey  = fs.readFileSync('cert/key.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};
var json_com="";
var interval;
var json_txt;
var msg_received;
var msg_type;
var msg_cmd;
var msg_node;
var rep;
var saverider, savetime, countdiff, phase1,ret,elim;
var Portselected;
var myPort;

console.log("**************************************************");
console.log("** Tag2Equipe Connector by Jumpingaccess Studio **");
console.log("**************************************************");
////////////////////////////////////////////////////////
///// File system verification for logs of activity
////////////////////////////////////////////////////////

if (!fs.existsSync(path_log)){
    fs.mkdirSync(path_log);
    console.log("LOG Folder :"+path_log+" has been successfully created");
} else {
    console.log("LOG Folder :"+path_log+" already exists");
}
//////////////////////////////////////////////////////////
///// Creation of the Log File
//////////////////////////////////////////////////////////

ligne = "["+TickTimer.ticksToTime(TickTimer.now())+"] Start of the log file\r\n";
fs.writeFile(path_log+"/log"+dateoftheday+".txt",ligne)

////////////////////////////////////////////////////////
// WebSocket Server to Equipe 
////////////////////////////////////////////////////////

const wss = new WebSocket.Server({port: 21000});
console.log("Websocket Server listening on : ws://127.0.0.1:21000");

////////////////////////////////////////////////////////
// WebSocket SSL Server to Equipe 
////////////////////////////////////////////////////////

 httpsServer = https.createServer(credentials, app);
 httpsServer.listen(21001);
 wssl = new WebSocketServer({
        server: httpsServer
      });
console.log("Secure Websocket Server listening on : wss://127.0.0.1:21001");
console.log("Application listening on : https://127.0.0.1:21001");


CLIENTS=[];

ligne = "["+TickTimer.ticksToTime(TickTimer.now())+"] Start of the Websocket Server \r\n";
fs.appendFile(path_log+"/log"+dateoftheday+".txt",ligne)
wss.on('connection', connection);   
wss.on('close',wsclose);
wssl.on('connection', connection);   
wssl.on('closewss',wsclose);
function connection(ws) {
        //////////////////////////////////
        /// Send Running time to Equipe //
        //////////////////////////////////
        CLIENTS.push(ws);
        interval = setInterval(function timeout() {
            json_txt = JSON.stringify({"type":"runningTime","payload":{"time": TickTimer.ticksToTime(TickTimer.now()),"ticks":TickTimer.now()}})
            ws.send(json_txt,function (){ /* ignore errors */ })    ;
        }, 75);

        ///////////////////////////////////////
        //// Json Parser 
        ///////////////////////////////////////
 

        ws.on('message', wsdata);
        function sendAll (message) {
            for (var i=0; i<CLIENTS.length; i++) {
                CLIENTS[i].send(message);
            };
        };
        function wsdata(data) {
            msg_received = JSON.parse(data);
            msg_type = msg_received["type"];
            msg_cmd = msg_received["payload"]["cmd"];
            msg_node = msg_received["payload"]["node"];
            if ((msg_type=='cmd') && (msg_cmd=="trigger") && (msg_node != "") ) {
                /////////////////////////////////////////////////////////////////////////////
                //// Send Pulse information when requested ( Tag Pulse or Manual in Equipe)
                /////////////////////////////////////////////////////////////////////////////
                rep = JSON.stringify({"type": "pulse", "payload":{ "timeTicks": TickTimer.now(), "node": msg_node, "resends": 1, "batteryLevel": 4, "RSSI": -10}});
                sendAll(rep);
                ligne = "["+TickTimer.ticksToTime(TickTimer.now())+"] New Pulse information on node:"+msg_node+" \r\n";
                fs.appendFile(path_log+"/log"+dateoftheday+".txt",ligne);
            };

            if ((msg_type=='output')) {
                /////////////////////////////////////////////////////////////////////////////
                ///// Payload Value treatment
                /////////////////////////////////////////////////////////////////////////////

                payload_output.countDown = msg_received["payload"]["countDown"];
                payload_output.countDownDiff = msg_received["payload"]["countDownDiff"];
                payload_output.countDownValue = msg_received["payload"]["countDownValue"];
                payload_output.faults = msg_received["payload"]["faults"];
                payload_output.fenceFaults = msg_received["payload"]["fenceFaults"];
                payload_output.horse=msg_received["payload"]["horse"];
                payload_output.id=msg_received["payload"]["id"];
                payload_output.phase=msg_received["payload"]["phase"];
                payload_output.previousTime=msg_received["payload"]["previousTime"];
                payload_output.rider=msg_received["payload"]["rider"];
                payload_output.round=msg_received["payload"]["round"];
                payload_output.running=msg_received["payload"]["running"];
                payload_output.startNo=msg_received["payload"]["startNo"];
                payload_output.time=msg_received["payload"]["time"];
                payload_output.timeAdded=msg_received["payload"]["timeAdded"];
                payload_output.timeFaults=msg_received["payload"]["timeFaults"];
                payload_output.timeToBeatDiff=msg_received["payload"]["timeToBeatDiff"];
                payload_output.timeToBeatTime=msg_received["payload"]["timeToBeatTime"];
                payload_output.timekeepingOutputId=msg_received["payload"]["timekeepingOutpuId"];
                payload_output.totalFaults=msg_received["payload"]["totalFaults"];
                payload_output.waiting=msg_received["payload"]["waiting"];
                

                if((payload_output.running== false)&&(payload_output.countDown==true)){
                    if (saverider != payload_output.rider) {
                        ligne = "["+TickTimer.ticksToTime(TickTimer.now())+"] New Start: Rider: "+payload_output.rider+" with horse: "+payload_output.horse+" \r\n";
                        fs.appendFile(path_log+"/log"+dateoftheday+".txt",ligne);
                    };
                };
                if((payload_output.running== true)&&(payload_output.countDown==false)&&(payload_output.phase==1)){
                    if (countdiff != payload_output.countDownDiff) {
                        ligne = "["+TickTimer.ticksToTime(TickTimer.now())+"] End of CountDown at: "+payload_output.countDownDiff+" \r\n";
                        fs.appendFile(path_log+"/log"+dateoftheday+".txt",ligne);
                    };
                };

                if((payload_output.running== true)&&(payload_output.countDown==false)&&(payload_output.phase==2)){
                    if (phase1 != payload_output.previousTime) {
                        ligne = "["+TickTimer.ticksToTime(TickTimer.now())+"] Phase 1 Time: "+payload_output.previousTime+" \r\n";
                        fs.appendFile(path_log+"/log"+dateoftheday+".txt",ligne);
                    };
                };

                if((payload_output.running== false)&&(payload_output.countDown==false)){
                    if (savetime != payload_output.time) {
                        ligne = "["+TickTimer.ticksToTime(TickTimer.now())+"] Finish for Rider: "+payload_output.rider+" with horse: "+payload_output.horse+" - Time:"+payload_output.time+" / Pen:"+payload_output.faults+" \r\n";
                        fs.appendFile(path_log+"/log"+dateoftheday+".txt",ligne);
                    };
                };

                if((payload_output.faults== "666")){
                        ligne = "["+TickTimer.ticksToTime(TickTimer.now())+"]  Retires for Rider: "+payload_output.rider+" with horse: "+payload_output.horse+"\r\n";
                        fs.appendFile(path_log+"/log"+dateoftheday+".txt",ligne);
                };
                if((payload_output.faults== "999")){
                        ligne = "["+TickTimer.ticksToTime(TickTimer.now())+"]  Elimination for Rider: "+payload_output.rider+" with horse: "+payload_output.horse+"\r\n";
                        fs.appendFile(path_log+"/log"+dateoftheday+".txt",ligne);
                };

                saverider = payload_output.rider;
                savetime = payload_output.time;
                countdiff = payload_output.countDownDiff;
                phase1 = payload_output.phase;
                ret=payload_output.faults;
                elim=payload_output.faults;

            };
        
        };
    

};
///////////////////////////////////////////////////
// Connection close Handler Websocket SSL
///////////////////////////////////////////////////

function wsclose() {
    clearInterval(interval);
    //console.log("Connection WS closed")
    ligne = "["+TickTimer.ticksToTime(TickTimer.now())+"] End of the Websocket Server.\r\n";
    fs.appendFile(path_log+"/log"+dateoftheday+".txt",ligne)

}

/////////////////////////////////////////////////////
/// Search of Serial Port available and Display.
/// If no Com used, ETH => ethernet connexion
/////////////////////////////////////////////////////
console.log ("Serial port Listing");
console.log(' Port: ETH');
ligne = "["+TickTimer.ticksToTime(TickTimer.now())+"] Listing of the availables ports:\r\nETH\r\n";
fs.appendFile(path_log+"/log"+dateoftheday+".txt",ligne)

SerialPort.list(function (err, ports) {
    ports.forEach(function(port) {
        Portfind=port.comName; 
        console.log(' Port:' +port.comName);
        ligne = "Port:"+port.comName+"\r\n";
        fs.appendFile(path_log+"/log"+dateoftheday+".txt",ligne)

   });
        
    // Prompt command line

    Portselected = readlineSync.question('Please Choose the Serial Port; ');
    if (S(Portselected).contains("COM") == true) {
        ligne = "["+TickTimer.ticksToTime(TickTimer.now())+"] Selected Port :"+Portselected+"\r\n";
        fs.appendFile(path_log+"/log"+dateoftheday+".txt",ligne)

        ///////////////////////
        /// COM Port Signal
        ///////////////////////
        
        console.log(' Port:' + Portselected);
        myPort = new SerialPort(Portselected, {
            baudrate: 9600,
            parser: SerialPort.parsers.readline("\n")
        });
        myPort.on('open', showPortOpen);
        myPort.on('data', sendSerialData);
        myPort.on('close', showPortClose);
        myPort.on('error', showError);



        function showPortOpen() {
            console.log('port open. Data rate: ' + myPort.options.baudRate);
        };
        
        function sendSerialData(data) {
            var info_com = data.split(" ");
            var new_com = "";
            var j=0;
            for (var i=0; i < info_com.length; i++){
                if (info_com[i] != "") { 
                        if (j == 2) {
                            var node = info_com[i];
                            if (S(node).contains("M") == true) {
                                node = S(node).right(1).s;
                            };
                            
                        };

                        j++;
                };

            };
            json_com = JSON.stringify({"type":"cmd","payload":{"cmd":"trigger","node":node}});
            ws_client = new WebSocket("ws://localhost:21000");
            ws_client.on('open', function open() {
                ws_client.send(json_com);
            });

        };
        
        function showPortClose() {
            console.log('port closed.');
        };
        
        function showError(error) {
            console.log('Serial port error: ' + error);
        };

    } else {
        ////////////////////////////////
        /// ETH Signals
        ////////////////////////////////
        
        var ETHselected = readlineSync.question('Please enter the IP of your TAG CP540/545; ');
        var HOST = ETHselected;
        var PORT = 7000;
        var client = new net.Socket();
        client.connect(PORT, HOST, function() {
            console.log('Connected on TAG HEUER 545/540 to: ' + HOST + ':' + PORT);
            var ligne = "["+TickTimer.ticksToTime(TickTimer.now())+"] Connected on TAG HEUER by network to :"+ HOST + ":" + PORT+"\r\n";
            fs.appendFile(path_log+"/log"+dateoftheday+".txt",ligne)
        });
        client.on('data', getethdata);
      
        function getethdata(data) {
            var buf = new Buffer(data,"utf8");
            if (S(buf.toString()).contains("TN") == true) {
                //////////////////////////////////////////////////////////
                /// ETH Data Treatment
                //////////////////////////////////////////////////////////
                var info_eth = S(data).splitLeft(' ');
                var new_eth = "";
                var j=0;
                for (var i=0; i < S(data).length; i++){
                    if (info_eth[i] != "") { 
                            if (j == 2) {
                                var node = info_eth[i];
                                if (S(node).contains("M") == true) {
                                    node = S(node).right(1).s;
                                }; 
                                
                            };

                            j++;
                    };

                };
                json_com = JSON.stringify({"type":"cmd","payload":{"cmd":"trigger","node":node}});
                ws_client = new WebSocket("ws://localhost:21000");
                ws_client.on('open', function open() {
                    ws_client.send(json_com);
                });
            };
        };
        
        client.on('close', function() {
            console.log('Connection closed');
        });
        
    };
});
