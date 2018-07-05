var EMS = require('./raw_data')

let binaryStateTimeData = (req, res) => {
	var accountID = req.params.accountID;
    var siteID = req.params.siteID;
    var relayID = req.query.relayID;
    var deviceID = req.query.deviceID;
    var beforeTime = req.query.beforeTime;
    var afterTime = req.query.afterTime;
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


	EMS.getDeviceLogs(req,res,accountID,siteID,relayID,deviceID,'power').then(function(response){
	            
	    console.log(response);
	    //res.status(200).send(deviceLogs);
	    response._embedded.logs.forEach((logsResp) => {
	        //console.log(logsResp)
	        deviceLogs.state.power.value.push(logsResp.metadata)
	        deviceLogs.state.power.timestamp.push(logsResp.timestamp)
	    })

	   res.status(200).send(deviceLogs); 
	});
}

module.exports ={
	binaryStateTimeData
}