'use strict';
var rp = require('request-promise');

let getEMS_RawData = (req,res) => {
    return new Promise(function(resolve,reject){

    var accountID = req.params.accountID;
    var siteID = req.params.siteID;
    var relayID = req.query.relayID;
    var deviceID = req.query.deviceID;
    var beforeTime = req.query.beforeTime;
    var afterTime = req.query.afterTime;

    if(relayID !== undefined && deviceID !== undefined){

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

            getDeviceLogs(req,accountID,siteID,relayID,deviceID,result[0]).then(function(response){
                response._embedded.logs.forEach((deviceEvent) => {
                    deviceLogs.state.power.value.push(deviceEvent.metadata)
                    deviceLogs.state.power.timestamp.push(deviceEvent.timestamp)
                })
               resolve(deviceLogs); 
            });

        },function(err) {
            reject(err)
        })
    } else {
        reject("Failure");
    }
});
};

let getDeviceLogs = (req,accountID,siteID,relayID,deviceID,stateID) => {
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