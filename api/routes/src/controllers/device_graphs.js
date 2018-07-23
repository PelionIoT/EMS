var EMS_Raw = require('./raw_data')

let getDeviceGraphs = (req, res) => {
    
    var deviceID = req.query.deviceID;
    // Precision = Days / Months / Year
    var precision = req.query.precision;
    // Precision Value
    // Days = Number of Days (ex: 2 / 7 / 25)
    // Month = Any month (ex: July)
    // Year = Any Year (ex: 2018)
    var precisionValue = req.query.pvalue

    if(precision != undefined && precision == "year"){
        EMS_Raw.getEMS_RawData(req,"asc").then(function(response){
            // Raw data returned by the devicelogs API
            //console.log(response);
            var result = getDataOfAYear(deviceID,response,2018);
            // Return result
            //console.log(getDataOfAYear(response,2018));
            res.status(200).send(result);
        }, function(error){
            console.log(error)
            res.status(500).send("Request Failed: No response received");
        });
    } else {
        res.status(500).send("Request Failed: Invalid parameters")
    }
    
}

let getDataOfAYear = (deviceID,raw_data,year) => {

    var eventValue = raw_data[deviceID].state.power.value;
    var eventTimestamp = raw_data[deviceID].state.power.timestamp;

    var yearLogs = {
            power: {
                total_on: {
                    x_months: [],
                    y_hours: []
                },
                total_off: {
                    x_months: [],
                    y_hours: []
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
        yearLogs.power.total_on.x_months.push(month+1);
        yearLogs.power.total_off.x_months.push(month+1);
        
        for(var i=0;i<eventValue.length;i++){
            var fetchedTime = new Date(eventTimestamp[i])
            if(fetchedTime.getMonth() == month){
               if(eventValue[i] == 'on' && (eventValue[i+1] == 'off' || eventValue[i+1] == 'on')){
                  //console.log("Extracted Timestamps: " + (eventTimestamp[i+1] - eventTimestamp[i]));
                  totalONhours += eventTimestamp[i+1] - eventTimestamp[i]; 
               }
               //console.log("All Timestamps: " + eventTimestamp[i]);
               isTimestampExists = true;
            } else {
               isTimestampExists = false; 
            }
        }

        if(isTimestampExists == false){
            //console.log("Timestamps: NO DATA");
            yearLogs.power.total_on.y_hours.push(0);
            yearLogs.power.total_off.y_hours.push(0);
        } else {
            //console.log("Total ON Hours Timestamp: " + totalONhours);
            //var d = new Date(totalONhours);
            //totalONhours = d.getHours();
            totalONhours = totalONhours/36000000;
            //totalONhours = totalONhours/36e5;
            //console.log("Total ON Hours: " + totalONhours);
            yearLogs.power.total_on.y_hours.push(totalONhours);
            // Calculate Total OFF Hours
            totalOFFhours = totalHours - totalONhours;
            yearLogs.power.total_off.y_hours.push(totalOFFhours);
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