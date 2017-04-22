///////////////////////////////////////////////////////////
///// Test File for the connector.
///// no more used
///// please use main.js
///////////////////////////////////////////////////////////



const WebSocket = require('ws');
var S = require('string');
const wss = new WebSocket.Server({port: 21000});
var json_com="";
var express = require('express');
var app = express();

wss.on('connection', connection);   
wss.on('close',wsclose);
function connection(ws) {
  //console.log("connected with WS");
  //ws.send('something');
   
        var interval = setInterval(function timeout() {
        var json_txt = JSON.stringify({"type":"runningTime",	"payload":{"time": TickTimer.ticksToTime(TickTimer.now()),"ticks":TickTimer.now()}})

        ws.send(json_txt,function (){ /* ignore errors */ });
        
         }, 75);
    ws.on('message', wsdata);

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
    //console.log(`Received:`+data);
    if (msg_type=="cmd") {

        var rep = JSON.stringify({"type":"pulse","payload":{"timeTicks": TickTimer.now(),"node": msg_node,"resends": 1,"batteryLevel": 4,"RSSI": -77}});
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(rep,function (){ /* ignore errors */ });
            }
    
        });
        
        //console.log(rep);
    } else {
         console.log(`Received:`+data);

    }
    
    };
 

};


function wsclose() {
    clearInterval(interval);
    //console.log("Connection WS closed")
}
 


const TickTimer = require("./time-ticks.js");
var Portfind;
var SerialPort = require('serialport');
console.log (TickTimer.ticksToTime(TickTimer.now()));
SerialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    Portfind=port.comName; 
    
    //console.log(port.comName);
  });
    console.log('Selected Port:' + Portfind);
    var myPort = new SerialPort(Portfind, {
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

       // {"type":"cmd","payload":{"cmd":"trigger","node":"4"}}

        /*
{"type":"pulse","payload":{"timeTicks": TickTimer.ticksToTime(TickTimer.now()),"node": node,"resends": 1,"batteryLevel": 4,"RSSI": -77}}
*/
    }
    
    function showPortClose() {
        console.log('port closed.');
    }
    
    function showError(error) {
        console.log('Serial port error: ' + error);
    }


    function runningTime() {



    }




});
