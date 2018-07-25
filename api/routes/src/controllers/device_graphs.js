var EMS_Raw = require('./raw_data')

let getDeviceGraphs = (req, res) => {
    
    var deviceID = req.query.deviceID;

    // Precision = Days / Months / Year
    var pType = req.query.ptype;

    // Precision Value
    // Days = 1Day / 1Week / 2Weeks
    // Month = 1Month / 3Month / 6Month
    // Year = Any Year (ex: 2018)
    var pValue = req.query.pvalue;

    // If specified then fetch particular device state else retrieve all.
    var state = req.query.state;

    if(pType != undefined && pType == "days" && pValue != undefined)
    {
        res.status(200).send("Under construction");
    }
    else if(pType != undefined && pType == "month" && pValue != undefined)
    {
        res.status(200).send("Under construction");
    }
    else if(pType != undefined && pType == "year" && pValue != undefined)
    {
        EMS_Raw.getEMS_RawData(req,"asc").then(function(raw_data){
            // Raw data returned by the devicelogs API
            //console.log(raw_data);
            var result = getDataOfAYear(deviceID, raw_data, pValue);
            //console.log(getDataOfAYear(deviceID, raw_data, precisionValue));
            res.status(200).send(result);
        }, function(error){
            console.log(error)
            res.status(500).send("Request Failed: No response received");
        });
    } 
    else 
    {
        res.status(500).send("Request Failed: Invalid parameters")
    }
    
}

let getDataOfDays = (deviceID,raw_data,year) => {

}

let getDataOfMonth = (deviceID,raw_data,year) => {

}

let getDataOfAYear = (deviceID,raw_data,year) => {

    //console.log(raw_data);

    var eventValue = raw_data[deviceID].state.power.value;
    var eventTimestamp = raw_data[deviceID].state.power.timestamp;

    var yearLogs = {
        [deviceID] : {
            state : {
                power: {
                  on: {
                    x_months: [],
                    y_hours: []
                  },
                  off: {
                    x_months: [],
                    y_hours: []
                  }
               }
           }
        }
    }

    // Go through each month in a year
    for(var month=0; month<12; month++){

        //console.log(getTotalDaysInMonth(month,2018));

        var totalDays = getTotalDaysInMonth(month,year);
        var totalHours = totalDays * 24;

        //console.log("Month: " + (month+1) + " Total Days: " + totalDays + " Total Hours: " + totalHours);

        var totalONhours=0;
        var totalOFFhours=0;
        var isTimestampExists = false;

        //console.log("Current Month: " + (month+1));
        yearLogs[deviceID].state.power.on.x_months.push(month+1);
        yearLogs[deviceID].state.power.off.x_months.push(month+1);
        
        for(var i=0;i<eventValue.length;i++){
            var fetchedTime = new Date(eventTimestamp[i])
            if(fetchedTime.getMonth() == month){
               if(eventValue[i] == 'on' && (eventValue[i+1] == 'off' || eventValue[i+1] == 'on')){
                  //console.log("Extracted Timestamps: " + (eventTimestamp[i+1] - eventTimestamp[i]));
                  totalONhours += eventTimestamp[i+1] - eventTimestamp[i]; 
               }
               //console.log("All Timestamps: " + eventTimestamp[i]);
               //isTimestampExists = true;
            } else {
               //isTimestampExists = false; 
            }
        }

        if(totalONhours != 0){
            isTimestampExists = true
        } else {
            isTimestampExists = false;
        }

        if(isTimestampExists == false){
            //console.log("Timestamps: NO DATA");
            yearLogs[deviceID].state.power.on.y_hours.push(0);
            yearLogs[deviceID].state.power.off.y_hours.push(0);
        } else {
            //console.log("Total ON Hours Timestamp: " + totalONhours);
            totalONhours = totalONhours/36000000;
            //totalONhours = totalONhours/36e5;
            yearLogs[deviceID].state.power.on.y_hours.push(totalONhours);
            // Calculate Total OFF Hours
            totalOFFhours = totalHours - totalONhours;
            yearLogs[deviceID].state.power.off.y_hours.push(totalOFFhours);
        }
    }
    //console.log(yearLogs);
    return yearLogs;
}

function getTotalDaysInMonth (month,year) {
    return new Date(year, month + 1, 0).getDate();
}

module.exports ={
    getDeviceGraphs
}