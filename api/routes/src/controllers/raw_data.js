'use strict';
var rp = require('request-promise');

let getEMS_RawData = (req,res) => {
    
    var accountID = req.params.accountID;
    var siteID = req.params.siteID;
    var relayID = req.query.relayID;
    var deviceID = req.query.deviceID;
    var beforeTime = req.query.beforeTime;
    var afterTime = req.query.afterTime;

    if(relayID !== undefined && deviceID !== undefined){

        //getDeviceLogs(req,res,accountID,siteID,relayID,deviceID);

        // var resultData = {
        //     "data": {
    
        //     }
        // };

        var deviceLogs = {
            state:{
                power: {
                    value: [],
                    timestamp: []
                }
                // ,
                // brightness: {
                //     value: [],
                //     timestamp: []
                // },
                // hsl: {
                //     value: [],
                //     timestamp: []
                // }
            }
        }

        // Get device states
        req.dcs.getResourceState(siteID, `id=\"${deviceID}\"`, null).then(function(resp) {
            
            var result = Object.keys(resp.state[deviceID]);

            getDeviceLogs(req,res,accountID,siteID,relayID,deviceID,result[0]).then(function(response){
            
                console.log(response);
                //res.status(200).send(deviceLogs);
                response._embedded.logs.forEach((logsResp) => {
                    //console.log(logsResp)
                    deviceLogs.state.power.value.push(logsResp.metadata)
                    deviceLogs.state.power.timestamp.push(logsResp.timestamp)
                })

               res.status(200).send(deviceLogs); 
            });
            
            //res.status(200).send(result);

        },function(err) {
            res.status(500).send(err)
        })
    
    
    } else {
        res.status(500).send("Failure");
    }
    
};

let getDeviceLogs = (req,res,accountID,siteID,relayID,deviceID,stateID) => {
    return new Promise(function(resolve,reject){
    var cloudurl = req.headers.cloudurl;
    var authToken = req.headers.authorization;

    var url = cloudurl + "/api/device_logs?account=" + accountID + "&site=" + siteID 
              + "&relay=" + relayID + "&device=" + deviceID + "&event=state-" + stateID;

    var options = {
        uri: url,
        headers: {
            'Authorization': authToken,
            'cloudurl': cloudurl
        },
        json: true // Automatically parses the JSON string in the response
    };
     
    rp(options)
        .then(function (response) {
            resolve(response);
        })
        .catch(function (err) {
            // API call failed...
            console.log(err);
            reject(err);
        });
    });
};

module.exports = {
    getEMS_RawData,
    getDeviceLogs
}