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
        var afterTime;
        if(pValue == "1D"){
            afterTime = getAfterDate(currentTime,"day",1)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then((raw_data) => {
                var result = getDataOfHours(deviceID,raw_data,24)
                res.status(200).send(result);
            }, (err) => {
                console.log("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
            })
        } else if(pValue == "2D"){
            afterTime = getAfterDate(currentTime,"day",2)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then(function(raw_data){
                var result = getDataOfDays(deviceID,raw_data,2)
                res.status(200).send(result);
            },function(error){
                console.log(error)
                res.status(500).send("Request Failed: No response received");
            })
        } else {
            res.status(500).send("Request Failed: Invalid parameters")
        }
    }
    else if(pType != undefined && pType == "Week" && pValue != undefined)
    {
        var afterTime;
        if(pValue == "1W"){
            afterTime = getAfterDate(currentTime,"week",1)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then((raw_data) => {
                var result = getDataOfDays(deviceID,raw_data,7,currentTime,afterTime)
                res.status(200).send(result);
            }, (err) => {
                console.log("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
            })
        }
        else if(pValue == "2W"){
            afterTime = getAfterDate(currentTime,"week",2)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then((raw_data) => {
                var result = getDataOfDays(deviceID,raw_data,14,currentTime,afterTime)
                res.status(200).send(result);
            }, (err) => {
                console.log("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
            })
        } else {
            res.status(500).send("Request Failed: Invalid parameters")
        }
    }
    else if(pType != undefined && pType == "Month" && pValue != undefined)
    {
        var afterTime;
        if(pValue == "1M"){
            afterTime = getAfterDate(currentTime,"month",1)
            //console.log("Before Date: " + currentTime + " After Date: " + afterTime)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then((raw_data) => {
                var dayCount = getTotalDaysInMonth(new Date().getMonth(),new Date().getFullYear());
                var result = getDataOfDays(deviceID,raw_data,dayCount,currentTime,afterTime)
                res.status(200).send(result);
            }, (err) => {
                console.log("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
            })
        } else if(pValue == "3M"){
            afterTime = getAfterDate(currentTime,"month",3)
            //console.log("Before Date: " + currentTime + " After Date: " + afterTime)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then(function(raw_data){
                var result = getDataOfMonths(deviceID,raw_data,currentTime,afterTime)
                res.status(200).send(result);
            },function(error){
                console.log(error)
                res.status(500).send("Request Failed: No response received");
            })
        } else if(pValue == "6M"){
            afterTime = getAfterDate(currentTime,"month",6)
            //console.log("Before Date: " + currentTime + " After Date: " + afterTime)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then(function(raw_data){
                var result = getDataOfMonths(deviceID,raw_data,currentTime,afterTime)
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
        console.log(currentTime)
        // Get last date of current year for beforeTime & last date of last year for afterTime
        var dateOb = new Date(currentTime)
        var beforeTime = new Date((dateOb.getFullYear()+1),0,1,5,0,0,0).toISOString()
        var afterTime = getAfterDate(currentTime,"year")
        //console.log("Before Date: " + beforeTime + " After Date: " + afterTime)
       
        EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then(function(raw_data){
            // Raw data returned by the devicelogs API
            //console.log(raw_data);
            //res.status(200).send(raw_data)
            var result = getDataOfAYear(deviceID, raw_data,currentTime,afterTime);
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

let getDataOfHours = (deviceID,raw_data,hoursCount) => {
    var eventValue = raw_data[deviceID].state.power.value;
    var eventTimestamp = raw_data[deviceID].state.power.timestamp;

    var dayLogs = {
        [deviceID] : {
            state : {
                power: {
                  on: {
                    x_hours: [],
                    y_hours: []
                  },
                  off: {
                    x_hours: [],
                    y_hours: []
                  }
               }
           }
        }
    }

    var day = new Date();
    for(var a=0; a<hoursCount; a++) {
        if(a > 0)   day.setHours(day.getHours()-1)

        var hour = day.getHours()
        var date = day.getDate()
        var month = day.getMonth()
        var year = day.getFullYear()
        var totalHours = hoursCount;

        var totalONhours=0;
        var totalOFFhours=0;

        dayLogs[deviceID].state.power.on.x_hours.push(date+' '+getMonthName(month)+', '+year+' '+hour+':00');
        dayLogs[deviceID].state.power.off.x_hours.push(date+' '+getMonthName(month)+', '+year+' '+hour+':00');

        for(var i=0;i<eventValue.length;i++){
            var fetchedTime = new Date(eventTimestamp[i])
            if(fetchedTime.getHours() == hour &&
                fetchedTime.getDate() == date &&
                fetchedTime.getMonth() == month &&
                fetchedTime.getFullYear() == year){
                if(eventValue[i] == 'on'){
                    totalONhours += eventTimestamp[i+1] - eventTimestamp[i];
                }
            }
        }

        if(totalONhours != 0){
            totalONhours = totalONhours/36000000;
            //totalONhours = totalONhours/36e5;
            dayLogs[deviceID].state.power.on.y_hours.push(totalONhours);
            // Calculate Total OFF Hours
            totalOFFhours = totalHours - totalONhours;
            dayLogs[deviceID].state.power.off.y_hours.push(totalOFFhours);
        } else {
            dayLogs[deviceID].state.power.on.y_hours.push(0);
            dayLogs[deviceID].state.power.off.y_hours.push(0);
        }
    }
    return dayLogs;
}

let getDataOfDays = (deviceID,raw_data,dayCount,beforeTime,afterTime) => {
    var eventValue = raw_data[deviceID].state.power.value;
    var eventTimestamp = raw_data[deviceID].state.power.timestamp;

    var dayLogs = {
        [deviceID] : {
            state : {
                power: {
                  on: {
                    x_days: [],
                    y_hours: []
                  },
                  off: {
                    x_days: [],
                    y_hours: []
                  }
               }
           }
        }
    }

    // Go through each day in a month
    var day = new Date();
    for(var a=0; a<dayCount; a++) {
        if(a > 0)   day.setDate(day.getDate()-1)
        var date = day.getDate()
        var month = day.getMonth()
        var year = day.getFullYear()
        var totalHours = 24;

        var totalONhours=0;
        var totalOFFhours=0;
        
        dayLogs[deviceID].state.power.on.x_days.push(date+' '+getMonthName(month)+' '+year);
        dayLogs[deviceID].state.power.off.x_days.push(date+' '+getMonthName(month)+' '+year);
        
        for(var i=0;i<eventValue.length;i++){
            var fetchedTime = new Date(eventTimestamp[i])
            if(fetchedTime.getDate() == date && 
                  fetchedTime.getMonth() == month && 
                  fetchedTime.getFullYear() == year){
               if(eventValue[i] == 'on'){
                if(eventTimestamp[i+1] != null){
                    totalONhours += eventTimestamp[i+1] - eventTimestamp[i];
                }
                  totalONhours += 0; 
               }
            }
        }

        if(totalONhours != 0){
            totalONhours = totalONhours/36000000;
            //totalONhours = totalONhours/36e5;
            dayLogs[deviceID].state.power.on.y_hours.push(totalONhours);
            // Calculate Total OFF Hours
            totalOFFhours = totalHours - totalONhours;
            dayLogs[deviceID].state.power.off.y_hours.push(totalOFFhours);
        } else {
            dayLogs[deviceID].state.power.on.y_hours.push(0);
            dayLogs[deviceID].state.power.off.y_hours.push(0);
        }
    }
    return dayLogs;
}

let getDataOfMonths = (deviceID,raw_data,beforeTime,afterTime) => {

    var startMonth = new Date(afterTime).getMonth()
    var endMonth = new Date(beforeTime).getMonth()
    var year = new Date().getFullYear();

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
    for(var j = 0; j < 11; j++) {
        if(startMonth == 0){
            var totalDays = getTotalDaysInMonth(startMonth,year);
            var totalHours = totalDays * 24;
            monthLogs[deviceID].state.power.on.x_months.push(getMonthName(startMonth) + ' ' + year);
            monthLogs[deviceID].state.power.off.x_months.push(getMonthName(startMonth) + ' ' + year)
            year = new Date().getFullYear() - 1;
            startMonth = 11
        }
        var totalDays = getTotalDaysInMonth(startMonth,year);
        var totalHours = totalDays * 24;


        var totalONhours=0;
        var totalOFFhours=0;
        var isTimestampExists = false;
        //console.log(startMonth)

        monthLogs[deviceID].state.power.on.x_months.push(getMonthName(startMonth)+ ' ' + year);
        monthLogs[deviceID].state.power.off.x_months.push(getMonthName(startMonth) );
        //console.log(monthLogs[deviceID].state.power)
        //console.log(getMonthName(startMonth))
        for(var i=0;i<eventValue.length;i++){
            var fetchedTime = new Date(eventTimestamp[i])
            if(fetchedTime.getMonth() == startMonth && fetchedTime.getFullYear() == year){
               if(eventValue[i] == 'on' && (eventValue[i+1] == 'off' || eventValue[i+1] == 'on')){
                  //console.log("Extracted Timestamps: " + (eventTimestamp[i+1] - eventTimestamp[i]));
                  totalONhours += eventTimestamp[i+1] - eventTimestamp[i]; 
                  //startMonth--
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
        startMonth--
    }
    monthLogs[deviceID].state.power.on.x_months.reverse()
    monthLogs[deviceID].state.power.on.y_hours.reverse()
    monthLogs[deviceID].state.power.off.x_months.reverse()
    monthLogs[deviceID].state.power.off.y_hours.reverse()
    //console.log(monthLogs[deviceID].state.power.on.x_months)
    return monthLogs;
    
}

let getDataOfAYear = (deviceID,raw_data,beforeTime,afterTime) => {
    return getDataOfMonths(deviceID,raw_data,beforeTime,afterTime)
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
          afterDate = new Date(dateOb.getFullYear(),(dateOb.getMonth()),1,5,29,0,0).toISOString()
      } else if(pvalue == 3){
          afterDate = new Date(dateOb.getFullYear(),(dateOb.getMonth()-3),1,5,29,0,0).toISOString()
      } else if(pvalue == 6){
          afterDate = new Date(dateOb.getFullYear(),(dateOb.getMonth()-6),1,5,29,0,0).toISOString()
      }
    } else if(ptype == "year"){
          afterDate = new Date((dateOb.getFullYear()-1),dateOb.getMonth(),(dateOb.getDate()),dateOb.getHours(),dateOb.getMinutes(),dateOb.getSeconds(),dateOb.getMilliseconds()).toISOString()
    }
    return afterDate
}

module.exports ={
    getDeviceGraphs
}
