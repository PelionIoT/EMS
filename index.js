const express = require('express');
const http = require('http')
const app = express();
const fs = require('fs')
const jsonminify = require('jsonminify');
const router = express.Router();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const device = require('express-device');
const WebSocket = require('ws');
const uuid = require("uuid");


//Logger
const Logger = require('./utils/logger');
const logger = new Logger( {moduleName: 'Module', color: 'bgBlue'} );

//Configuration
const config = JSON.parse(jsonminify(fs.readFileSync('./ems-config.json', 'utf8')));
//const port = process.env.MONGO_URI ? config.prodPort : config.devPort;
const port = config.devPort
const mongoServerURI = process.env.MONGO_URI || config.MONGO_URI;
global.EMSLogLevel = config.logLevel || 2;

app.use(bodyParser.urlencoded({ limit: '50mb',extended: true }));
// parse requests of content-type - application/json
app.use(bodyParser.json({limit: '50mb'}));
app.use(device.capture());


// Initate mongoose instance
// logger.info('Connecting to mongo server at ' + mongoServerURI);
// mongoose.Promise = global.Promise;
// mongoose.connect(mongoServerURI);
// mongoose.connection.on('error', function(error) {
//     logger.error('MongoDB connection error' + error);
// });

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });
wss.on('connection', function connection(ws,req) {

  ws.id = uuid.v4();
  ws.send(ws.id+"");
  ws.on('message', function incoming(data) {
    wss.clients.forEach(function each(client) {
      //client.send(data);
      let obj = JSON.parse(data);
      if(client.id==obj.id){
        client.send(obj.message);
      }
    });
  });
});

try {
    app.use(require('./api/routes'));
} catch(err) {
    logger.error('Could not load routes ' + JSON.stringify(err));
    console.log(err);
    process.exit(1);
}



server.listen(port, () => {
    logger.info(`Server active on port: ${server.address().port}`);
});


logger.info('EMS API Server started on: ' + port);