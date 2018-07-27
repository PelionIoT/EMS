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
    var currentTime = new Date().toISOString();

    if(pType != undefined && pType == "Days" && pValue != undefined)
    {
        res.status(200).send("Under construction");
    }
    else if(pType != undefined && pType == "Month" && pValue != undefined)
    {
        var afterTime;
        if(pValue == "1M"){
            afterTime = getAfterDate(currentTime,"month",1)
            EMS_Raw.getEMS_RawData(req, "desc", currentTime, afterTime).then((raw_data) => {
                var result = getDataOfMonth(deviceID,raw_data)
                res.status(200).send(raw_data);
            }, (err) => {
                console.log("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
            })
        } else if(pValue == "3M"){
            afterTime = getAfterDate(currentTime,"month",3)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then(function(raw_data){
                var startMonth = new Date(afterTime).getMonth()
                var endMonth = new Date(currentTime).getMonth()
                var result = getDataOfMonths(deviceID,raw_data,startMonth,endMonth)
                res.status(200).send(result);
            },function(error){
                console.log(error)
                res.status(500).send("Request Failed: No response received");
            })
        } else if(pValue == "6M"){
            afterTime = getAfterDate(currentTime,"month",6)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then(function(raw_data){
                var startMonth = new Date(afterTime).getMonth()
                var endMonth = new Date(currentTime).getMonth()
                var result = getDataOfMonths(deviceID,raw_data,startMonth,endMonth)
                res.status(200).send(result);
            },function(error){
                console.log(error)
                res.status(500).send("Request Failed: No response received");
            })
           
        } else {
            res.status(500).send("Request Failed: Invalid parameters")
        }
    }
    else if(pType != undefined && pType == "Year")
    {
        // Get last date of current year for beforeTime & last date of last year for afterTime
        var dateOb = new Date(currentTime)
        var beforeTime = new Date((dateOb.getFullYear()+1),0,1,0,0,0,0).toISOString()
        var afterTime = getAfterDate(currentTime,"year")
        //console.log("Before Date: " + beforeTime + " After Date: " + afterTime)
       
        EMS_Raw.getEMS_RawData(req, "asc", beforeTime, afterTime).then(function(raw_data){
            // Raw data returned by the devicelogs API
            //console.log(raw_data);
            var result = getDataOfAYear(deviceID, raw_data);
            //console.log(getDataOfAYear(deviceID, raw_data, pValue));
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

let getDataOfDays = (deviceID,raw_data) => {

}


let getDataOfMonth = (deviceID,raw_data) => {
    var eventValue = raw_data[deviceID].state.power.value;
    var eventTimestamp = raw_data[deviceID].state.power.timestamp;
    
}

let getDataOfMonths = (deviceID,raw_data,startMonth,endMonth) => {
    var eventValue = raw_data[deviceID].state.power.value;
    var eventTimestamp = raw_data[deviceID].state.power.timestamp;

    var monthLogs = {
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

    // Go through each month
    for(var month=startMonth; month<endMonth; month++) {
        var year = new Date().getFullYear();
        var totalDays = getTotalDaysInMonth(month,year);
        var totalHours = totalDays * 24;

        //console.log("Month: " + (month+1) + " Total Days: " + totalDays + " Total Hours: " + totalHours);

        var totalONhours=0;
        var totalOFFhours=0;
        var isTimestampExists = false;

        //console.log("Current Month: " + (month+1));
        monthLogs[deviceID].state.power.on.x_months.push(getMonthName(month));
        monthLogs[deviceID].state.power.off.x_months.push(getMonthName(month));
        
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
            monthLogs[deviceID].state.power.on.y_hours.push(0);
            monthLogs[deviceID].state.power.off.y_hours.push(0);
        } else {
            //console.log("Total ON Hours Timestamp: " + totalONhours);
            totalONhours = totalONhours/36000000;
            //totalONhours = totalONhours/36e5;
            monthLogs[deviceID].state.power.on.y_hours.push(totalONhours);
            // Calculate Total OFF Hours
            totalOFFhours = totalHours - totalONhours;
            monthLogs[deviceID].state.power.off.y_hours.push(totalOFFhours);
        }
    }
    //console.log(monthLogs);
    return monthLogs;
}

let getDataOfAYear = (deviceID,raw_data) => {
    return getDataOfMonths(deviceID,raw_data,0,12)
}

function getTotalDaysInMonth (month,year) {
    return new Date(year, month + 1, 0).getDate();
}

function getMonthName(monthNumber){
   var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
   return months[monthNumber];
}

function getAfterDate(beforeTime,ptype,pvalue){
    var dateOb = new Date(beforeTime);
    var afterDate;
    if(ptype == "day"){
        if(pvalue == 1){
            afterDate = new Date(dateOb.getFullYear(),dateOb.getMonth(),dateOb.getDate(),(dateOb.getHours()-24),dateOb.getMinutes(),dateOb.getSeconds(),dateOb.getMilliseconds()).toISOString()
        } else if(pvalue == 2){
            afterDate = new Date(dateOb.getFullYear(),dateOb.getMonth(),dateOb.getDate(),(dateOb.getHours()-48),dateOb.getMinutes(),dateOb.getSeconds(),dateOb.getMilliseconds()).toISOString()
        }
    } else if(ptype == "week"){
        if(pvalue == 1){
            afterDate = new Date(dateOb.getFullYear(),dateOb.getMonth(),(dateOb.getDate()-7),dateOb.getHours(),dateOb.getMinutes(),dateOb.getSeconds(),dateOb.getMilliseconds()).toISOString()
        } else if(pvalue == 2){
            afterDate = new Date(dateOb.getFullYear(),dateOb.getMonth(),(dateOb.getDate()-14),dateOb.getHours(),dateOb.getMinutes(),dateOb.getSeconds(),dateOb.getMilliseconds()).toISOString()
        }
    } else if(ptype == "month"){
      if(pvalue == 1){
          afterDate = new Date(dateOb.getFullYear(),(dateOb.getMonth()-1),dateOb.getDate(),dateOb.getHours(),dateOb.getMinutes(),dateOb.getSeconds(),dateOb.getMilliseconds()).toISOString()
      } else if(pvalue == 3){
          afterDate = new Date(dateOb.getFullYear(),(dateOb.getMonth()-3),dateOb.getDate(),dateOb.getHours(),dateOb.getMinutes(),dateOb.getSeconds(),dateOb.getMilliseconds()).toISOString()
      } else if(pvalue == 6){
          afterDate = new Date(dateOb.getFullYear(),(dateOb.getMonth()-6),dateOb.getDate(),dateOb.getHours(),dateOb.getMinutes(),dateOb.getSeconds(),dateOb.getMilliseconds()).toISOString()
      }
    } else if(ptype == "year"){
          afterDate = new Date((dateOb.getFullYear()-1),11,31,11,59,59,59).toISOString()
    }
    return afterDate
}

module.exports ={
    getDeviceGraphs
}