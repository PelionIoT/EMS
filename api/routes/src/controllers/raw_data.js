let getRawData = (req,res) => {
    
    var beforeTime = req.query.before;
    var afterTime = req.query.after;
    var state = req.query.state;

    if(beforeTime != undefined && afterTime != undefined){
        getEMS_RawData(req, "desc", beforeTime, afterTime).then(function(response){
            res.status(200).send(response);
         }, function(error){
            res.status(500).send(error)
         });
    }
    else if(beforeTime != undefined && afterTime != undefined && state != undefined){
        getEMS_RawData(req, "desc", beforeTime, afterTime, state).then(function(response){
            res.status(200).send(response);
         }, function(error){
            res.status(500).send(error)
         });
    }
    else if(state != undefined){
        getEMS_RawData(req, "desc", null, null, state).then(function(response){
            res.status(200).send(response);
         }, function(error){
            res.status(500).send(error)
         });
    }
    else {
        getEMS_RawData(req,"desc").then(function(response){
            res.status(200).send(response);
         }, function(error){
            res.status(500).send(error)
         });
    }
};

let getEMS_RawData = (req, sortOrder, beforeTime, afterTime, devState) => {
    
    return new Promise(function(resolve,reject){
    
    // Param Values    
    var accountID = req.params.accountID;
    var siteID = req.params.siteID;
    var relayID = req.params.relayID;
    // Query Values
    var deviceID = req.query.deviceID;

    // Returned Data BaseModel
    var deviceLogs = { [deviceID]: { state:{ } } }
    

    if(beforeTime == undefined || afterTime == undefined){
        beforeTime = null
        afterTime = null
    }

    if(devState == undefined) {
       devState = null
    // Get device states
    req.dcs.getDeviceInterfaces(siteID,deviceID).then(function(deviceStatesObject){
       //console.log(deviceStatesObject)
       var allDeviceStates = Object.keys(deviceStatesObject)
       //console.log(allDeviceStates)
       // Get logs from device_logs API
       req.dcs.getDeviceLogs(accountID,siteID,relayID,deviceID,devState,beforeTime,afterTime,null,sortOrder).then(function(response){
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
    });
    } 
    else { 
    var stateID = devState
    devState = "state-" + devState
    // Get logs from device_logs API
    req.dcs.getDeviceLogs(accountID,siteID,relayID,deviceID,devState,beforeTime,afterTime,null,sortOrder).then(function(response){
        //console.log(response);
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
     resolve(deviceLogs);
    }, function(err){
     reject(err)
    });
    }  
    });
};

module.exports = {
    getRawData,
    getEMS_RawData
}