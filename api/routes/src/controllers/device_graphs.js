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
                var result = getDataOfHours(deviceID,raw_data,48)
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
                var result = getDataOfDays(deviceID,raw_data,30,currentTime,afterTime)
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
        //console.log(currentTime)
        // Get last date of current year for beforeTime & last date of last year for afterTime
        var afterTime = getAfterDate(currentTime,"year")
       
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
                  days: [],  
                  usage: {
                    rating: "9W",
                    currency: "INR",
                    unit_cost: 4,  
                    kWh: [],
                    cost: []
                  },  
                  on_hours: [],
                  off_hours: []
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

        dayLogs[deviceID].state.power.days.push(date+' '+getMonthName(month)+', '+year+' '+hour+':00');

        for(var i=0;i<eventValue.length;i++){
            var fetchedTime = new Date(eventTimestamp[i])
            if(fetchedTime.getHours() == hour &&
                fetchedTime.getDate() == date &&
                fetchedTime.getMonth() == month &&
                fetchedTime.getFullYear() == year){
                if(eventValue[i+1] != null && eventValue[i] == 'on'){
                    totalONhours += eventTimestamp[i+1] - eventTimestamp[i];
                }
            }
        }

        if(totalONhours != 0){
            totalONhours = totalONhours/3600000;
            var device_rating = 9
            var watt_hrs_day = device_rating * totalONhours
            var kWh_hrs_day = watt_hrs_day / 1000
            var unit_cost = kWh_hrs_day * 4

            dayLogs[deviceID].state.power.usage.kWh.push(kWh_hrs_day);
            dayLogs[deviceID].state.power.usage.cost.push(unit_cost);
            dayLogs[deviceID].state.power.on_hours.push(totalONhours);
            // Calculate Total OFF Hours
            totalOFFhours = totalHours - totalONhours;
            dayLogs[deviceID].state.power.off_hours.push(totalOFFhours);
        } else {
            dayLogs[deviceID].state.power.usage.kWh.push(0);
            dayLogs[deviceID].state.power.usage.cost.push(0);
            dayLogs[deviceID].state.power.on_hours.push(0);
            dayLogs[deviceID].state.power.off_hours.push(0);
        }
    }
    return dayLogs;
}

let getDataOfDays = (deviceID,raw_data,dayCount,beforeTime,afterTime) => {
    var eventValue = raw_data[deviceID].state.power.value;
    var eventTimestamp = raw_data[deviceID].state.power.timestamp;

    //the currentTime can be used for last duration calc
    eventTimestamp.push(new Date(beforeTime).getTime());

    var dayLogs = {
        [deviceID] : {
            state : {
                power: {
                  days: [],  
                  usage: {
                    rating: "9W",
                    currency: "INR",
                    unit_cost: 4,  
                    kWh: [],
                    cost: []
                  },  
                  on_hours: [],
                  off_hours: []
               }
           }
        }
    }
    

    // Go through each day in a month
    var day = new Date(afterTime);
    var nextday = new Date(afterTime);
    var lastState; //stores the last state of previous day to calc carry over duration for current day
    for(var a=0,i=0,fetchedTime = new Date(eventTimestamp[i]); a<dayCount; a++) {
        if(a>0) day.setDate(day.getDate()+1);
        nextday.setDate(nextday.getDate()+1);
        var date = day.getDate()

        var data= {
            on: 0,
            off: 0
        }
        
        dayLogs[deviceID].state.power.days.push(date+' '+getMonthName(day.getMonth()));

        if(lastState != undefined) {//add carry over duration
            data[lastState] += fetchedTime - day;
        }

        for(; i<eventValue.length && fetchedTime<nextday; i++){
            data[eventValue[i]] += eventTimestamp[i+1] - eventTimestamp[i];
            lastState=eventValue[i]
            fetchedTime = new Date(eventTimestamp[i+1])
        }
        //fetchedTime will be in next day, so subtract extra duration
        if(nextday < fetchedTime) data[lastState] -= fetchedTime - nextday;

        var totalONhours = data.on/3600000
        var device_rating = 9
        var watt_hrs_day = device_rating * totalONhours
        var kWh_hrs_day = watt_hrs_day / 1000
        var unit_cost = kWh_hrs_day * 4

        dayLogs[deviceID].state.power.usage.kWh.push(kWh_hrs_day);
        dayLogs[deviceID].state.power.usage.cost.push(unit_cost);
        dayLogs[deviceID].state.power.on_hours.push(totalONhours);
        dayLogs[deviceID].state.power.off_hours.push(data.off/3600000);
        
    }
    return dayLogs;
}

let getDataOfMonths = (deviceID,raw_data,beforeTime,afterTime) => {
    var eventValue = raw_data[deviceID].state.power.value;
    var eventTimestamp = raw_data[deviceID].state.power.timestamp;
    //the currentTime can be used for last duration calc
    eventTimestamp.push(new Date(beforeTime).getTime());

    var dayLogs = {
        [deviceID] : {
            state : {
                power: {
                  months: [],  
                  usage: {
                    rating: "9W",
                    currency: "INR",
                    unit_cost: 4,  
                    on_days: [],
                    kWh: [],
                    cost: []
                  },  
                  on_hours: [],
                  off_hours: []
               }
           }
        }
    }

    // Go through each day in a month
    var day = new Date(afterTime);
    var nextday = new Date(afterTime);
    var year = day.getFullYear();
    var lastState; //stores the last state of previous day to calc carry over duration for current day
    var MD = monthDiff(new Date(afterTime),new Date(beforeTime))
    for(var a=0,i=0,fetchedTime = new Date(eventTimestamp[i]); a<=MD; a++) {
        if(a>0) day.setMonth(day.getMonth()+1);
        nextday.setMonth(nextday.getMonth()+1);

        year = day.getFullYear();
        //var totalHours = 24*getTotalDaysInMonth(day.getMonth(),year);

        var data= {
            on: 0,
            off: 0
        }
        
        dayLogs[deviceID].state.power.months.push(getMonthName(day.getMonth()));

        if(lastState != undefined) {//add carry over duration
            data[lastState] += fetchedTime - day;
        }

        for(; i<eventValue.length && fetchedTime<nextday; i++){
            data[eventValue[i]] += eventTimestamp[i+1] - eventTimestamp[i];
            lastState=eventValue[i]
            fetchedTime = new Date(eventTimestamp[i+1])
        }
        //fetchedTime will be in next day, so subtract extra duration
        if(nextday < fetchedTime) data[lastState] -= fetchedTime - nextday;
        
        var totalONhours = data.on/3600000
        var device_rating = 9
        var watt_hrs_day = device_rating * 24
        var kWh_hrs_day = watt_hrs_day / 1000
        var totalONDays = totalONhours / 24
        var kWh_per_month = kWh_hrs_day * totalONDays
        var unit_cost = kWh_per_month * 4

        dayLogs[deviceID].state.power.usage.on_days.push(Math.round(totalONDays));
        dayLogs[deviceID].state.power.usage.kWh.push(kWh_per_month);
        dayLogs[deviceID].state.power.usage.cost.push(unit_cost);
        dayLogs[deviceID].state.power.on_hours.push(totalONhours);
        dayLogs[deviceID].state.power.off_hours.push(data.off/3600000);
    }
    return dayLogs;
    
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

function monthDiff(d1, d2) {
    var months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth() + 1;
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
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
            afterDate = new Date(dateOb.getFullYear(),dateOb.getMonth(),(dateOb.getDate()-6)).toISOString()
        } else if(pvalue == 2){
            afterDate = new Date(dateOb.getFullYear(),dateOb.getMonth(),(dateOb.getDate()-13)).toISOString()
        }
    } else if(ptype == "month"){
      if(pvalue == 1){
          afterDate = new Date(dateOb.getFullYear(),dateOb.getMonth(), dateOb.getDate()-29).toISOString()
      } else if(pvalue == 3){
          afterDate = new Date(dateOb.getFullYear(),dateOb.getMonth()-3).toISOString()
      } else if(pvalue == 6){
          afterDate = new Date(dateOb.getFullYear(), dateOb.getMonth()-6).toISOString()
      }
    } else if(ptype == "year"){
          afterDate = new Date((dateOb.getFullYear()-1),dateOb.getMonth()).toISOString()
    }
    return afterDate
}

module.exports ={
    getDeviceGraphs
}
