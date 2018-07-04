'use strict';
var rp = require('request-promise');

let getEMSData = (req,res) => {
    
    var accountID = req.params.accountID;
    var siteID = req.params.siteID;
    var relayID = req.query.relayID;
    var deviceID = req.query.deviceID;
    var beforeTime = req.query.beforeTime;
    var afterTime = req.query.afterTime;

    if(relayID !== undefined && deviceID !== undefined){

        getDeviceLogs(req,res,accountID,siteID,relayID,deviceID);

        /* Get device states
        req.dcs.getResourceState(siteID, `id=\"${deviceID}\"`, null).then(function(resp, err) {
            res.status(200).send(resp.state[deviceID])
        },function(err) {
            res.status(500).send(err)
        })*/
    
    
    } else {
        res.status(500).send("Failure");
    }
    
};

let getDeviceLogs = (req,res,accountID,siteID,relayID,deviceID) => {
    
    var cloudurl = req.headers.cloudurl;
    var authToken = req.headers.authorization;

    var url = cloudurl + "/api/device_logs?account=" + accountID + "&site=" + siteID 
              + "&relay=" + relayID + "&device=" + deviceID;

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
            console.log(response);
            res.status(200).send(response);
        })
        .catch(function (err) {
            // API call failed...
            console.log(err);
        });

};

module.exports = {
    getEMSData,
    getDeviceLogs
}