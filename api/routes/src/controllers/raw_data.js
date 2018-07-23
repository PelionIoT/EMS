'use strict';
const DeviceStateConstants = require('../middlewares/stateconstants')
var rp = require('request-promise');

let getRawData = (req,res) => {
    getEMS_RawData(req,"desc").then(function(response){
       res.status(200).send(response);
    }, function(error){
       res.status(500).send(error)
    });
};

let getEMS_RawData = (req, sortOrder) => {
    
    return new Promise(function(resolve,reject){
    
    // Param Values    
    var accountID = req.params.accountID;
    var siteID = req.params.siteID;
    var relayID = req.params.relayID;
    // Query Values
    var deviceID = req.query.deviceID;
    

    var deviceLogs = { [deviceID]: { state:{ } } }

    // Get device states
    /*req.dcs.getResourceState(siteID, `id=\"${deviceID}\"`, null).then(function(resp) {*/
            
            //console.log(DeviceStateConstants.allstates.light_bulb_state)
            var allDeviceStates = DeviceStateConstants.allstates.light_bulb_state
            //var allDeviceStates = Object.keys(resp.state[deviceID]);
            //console.log(allDeviceStates);

            //var queryString = "&relay=" + relayID + "&device=" + deviceID + "&event=state-" + result[0];
            var queryString = "&relay=" + relayID + "&device=" + deviceID + "&sort=" + sortOrder;
            
            getDeviceLogs(req,accountID,siteID,queryString).then(function(response){
                //console.log(response);
                allDeviceStates.forEach((stateID) => {
                    var stateModel = {
                                  isDataAvailable: false,
                                  value: [],
                                  timestamp: []
                                 }
                    deviceLogs[deviceID].state[stateID] = stateModel
                    //console.log(stateID)
                    response._embedded.logs.forEach((deviceEvent) => {
                        if(deviceEvent.event == "state-" + stateID){
                            deviceLogs[deviceID].state[stateID].isDataAvailable = true;
                            deviceLogs[deviceID].state[stateID].value.push(deviceEvent.metadata)
                            deviceLogs[deviceID].state[stateID].timestamp.push(deviceEvent.timestamp)
                            //console.log(deviceLogs)
                        } else {
                            deviceLogs[deviceID].state[stateID].isDataAvailable = false;
                        }
                    })
                })
                resolve(deviceLogs); 
            }, function(err){
                reject(err)
            });

        /*},function(err) {
            reject(err)
        })*/
    });
};

let getDeviceLogs = (req,accountID,siteID,queryString) => {
    return new Promise(function(resolve,reject){
    var cloudurl = req.headers.cloudurl;
    var authToken = req.headers.authorization;

    /*Old method 
      var url = cloudurl + "/api/device_logs?account=" + accountID + "&site=" + siteID 
              + "&relay=" + relayID + "&device=" + deviceID + "&event=state-" + stateID;*/

      var url = cloudurl + "/api/device_logs?account=" + accountID + "&site=" + siteID + queryString;        

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
    getRawData,
    getEMS_RawData,
    getDeviceLogs
}