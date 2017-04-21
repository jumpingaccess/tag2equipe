const WebSocket = require('ws');
var S = require('string');
var express = require('express');
var readlineSync = require('readline-sync');
const TickTimer = require("./time-ticks.js");
var Portfind;
var SerialPort = require('serialport');
var net = require('net');

////////////////////////////////////////////////////////
// WebSocket Server to Equipe 
////////////////////////////////////////////////////////

const wss = new WebSocket.Server({port: 21000});
CLIENTS=[];
var json_com="";

var app = express();

wss.on('connection', connection);   
wss.on('close',wsclose);
function connection(ws) {
        //////////////////////////////////
        /// Send Running time to Equipe //
        //////////////////////////////////
        CLIENTS.push(ws);
        var interval = setInterval(function timeout() {
            var json_txt = JSON.stringify({"type":"runningTime","payload":{"time": TickTimer.ticksToTime(TickTimer.now()),"ticks":TickTimer.now()}})
            ws.send(json_txt,function (){ /* ignore errors */ })    ;
        
        }, 75);
    
    
        ///////////////////////////////////////
        //// Json Parser 
        ///////////////////////////////////////
 

        ws.on('message', wsdata);
        function sendAll (message) {
            for (var i=0; i<CLIENTS.length; i++) {
                CLIENTS[i].send(message);
            }
        }
        function wsdata(data) {
        /*Received:{"type":"cmd","payload":{"cmd":"trigger","node":"1"}}
        Received:{"type":"cmd","payload":{"cmd":"trigger","node":"2"}}
        Received:{"type":"cmd","payload":{"cmd":"trigger","node":"4"}}
        */

        var msg_received = JSON.parse(data);
        var msg_type = msg_received["type"];
        var msg_cmd = msg_received["payload"]["cmd"];
        var msg_node = msg_received["payload"]["node"];
        //console.log("parsed:"+msg_type +" / "+msg_cmd+" / "+msg_node);
        
        if ((msg_type=='cmd') && (msg_cmd=="trigger") && (msg_node != "") ) {
           //console.log(`Received:`+data);
            var rep = JSON.stringify({"type": "pulse", "payload":{ "timeTicks": TickTimer.now(), "node": msg_node, "resends": 1, "batteryLevel": 4, "RSSI": -10}});
            //{ "type": "pulse", "payload": { "timeTicks": 60926928, "node": "1", "resends": "3", "batteryLevel": "2", "RSSI": "79" }}
        
            //wss.clients.forEach(function each(client) {
                
                //if (client !== ws && client.readyState === WebSocket.OPEN) {
                    //console.log(client+" / "+rep);
                    sendAll(rep);
                    //client.send(rep, function ack(error) {
                        // If error is not defined, the send has been completed, otherwise the error 
                        // object will indicate what failed. 
                            //console.log(error);
                   // });
              //  }
        
            //});
            
            /*
            wss.broadcast = function broadcast(rep) {
                 wss.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(rep);
                    }
                });    
            };
            */


           // console.log(rep);
        } else {
            //console.log(`Received:`+data);

        };
        
        };
    

};

///////////////////////////////////////////////////
// Connection close Handler
///////////////////////////////////////////////////

function wsclose() {
    clearInterval(interval);
    //console.log("Connection WS closed")
}
 


/////////////////////////////////////////////////////
/// Search of Serial Port available and Display.
/// If no Com used, ETH => ethernet connexion
/////////////////////////////////////////////////////
console.log ("Serial port Listing");
console.log(' Port: ETH');
SerialPort.list(function (err, ports) {
    ports.forEach(function(port) {
        Portfind=port.comName; 
        console.log(' Port:' +port.comName);
    });

    
        
    // Prompt command line

    var Portselected = readlineSync.question('Please Choose the Serial Port; ');




    if (S(Portselected).contains("COM") == true) {
        ///////////////////////
        /// COM Port Signal
        ///////////////////////
        
        console.log(' Port:' + Portselected);
        var myPort = new SerialPort(Portselected, {
            baudrate: 9600,
            parser: SerialPort.parsers.readline("\n")
        });
        myPort.on('open', showPortOpen);
        myPort.on('data', sendSerialData);
        myPort.on('close', showPortClose);
        myPort.on('error', showError);



        function showPortOpen() {
            console.log('port open. Data rate: ' + myPort.options.baudRate);
        }
        
        function sendSerialData(data) {
            //console.log("received from Tag:"+data);
            var info_com = data.split(" ");
            var new_com = "";
            //console.log(info_com);
            var j=0;
            for (var i=0; i < info_com.length; i++){
            if (info_com[i] != "") { 
                // console.log(j+" : "+info_com[i] + " / ");
                    if (j == 2) {
                        var node = info_com[i];
                        if (S(node).contains("M") == true) {
                            node = S(node).right(1).s;
                        } 
                        
                    }

                    j++;
            }

            }
            json_com = JSON.stringify({"type":"cmd","payload":{"cmd":"trigger","node":node}});
            //connection.apply(json_com);
            //console.log(new_com);  
            ws_client = new WebSocket("ws://localhost:21000");
            ws_client.on('open', function open() {
                ws_client.send(json_com);
                //console.log(json_com);
            });

        }
        
        function showPortClose() {
            console.log('port closed.');
        }
        
        function showError(error) {
            console.log('Serial port error: ' + error);
        }

    } else {
        ////////////////////////////////
        /// ETH Signals
        ////////////////////////////////
        
        var ETHselected = readlineSync.question('Please enter the IP of your TAG CP540/545; ');
        var HOST = ETHselected;
        var PORT = 7000;
        var client = new net.Socket();
        client.connect(PORT, HOST, function() {
            console.log('CONNECTED TO: ' + HOST + ':' + PORT);
        });
        client.on('data', getethdata);

        function getethdata(data) {
            //////////////////////////////////////////////////////////
            /// ETH Data Treatment
            //////////////////////////////////////////////////////////
            var info_eth = S(data).splitLeft(' ');
            var new_eth = "";
            //console.log(info_com);
            var j=0;
            for (var i=0; i < S(data).length; i++){
            if (info_eth[i] != "") { 
                // console.log(j+" : "+info_com[i] + " / ");
                    if (j == 2) {
                        var node = info_eth[i];
                        if (S(node).contains("M") == true) {
                            node = S(node).right(1).s;
                        } 
                        
                    }

                    j++;
            }

            }
            json_com = JSON.stringify({"type":"cmd","payload":{"cmd":"trigger","node":node}});
            //connection.apply(json_com);
            //console.log(new_com);  
            ws_client = new WebSocket("ws://localhost:21000");
            ws_client.on('open', function open() {
                ws_client.send(json_com);
                //console.log(json_com);
            });
        };
        
        client.on('close', function() {
            console.log('Connection closed');
            //client.destroy();
        });
        
    }
});
