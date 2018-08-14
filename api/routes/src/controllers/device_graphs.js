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

    var currentTime = new Date().toISOString();

    if(pType != undefined && pType == "Days" && pValue != undefined)
    {
        var afterTime;
        if(pValue == "1D"){
            afterTime = getAfterDate(currentTime,"day",1)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then((raw_data) => {
                var result = getDataOfHours(deviceID,raw_data,24,currentTime,afterTime)
                res.status(200).send(result);
            }, (err) => {
                console.log("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
            })
        } else if(pValue == "2D"){
            afterTime = getAfterDate(currentTime,"day",2)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then(function(raw_data){
                var result = getDataOfHours(deviceID,raw_data,48,currentTime,afterTime)
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

let PowerModel = {
        duration: {
          type: "",
          value: []
        },  
        usage: {
          rating: "9W",
          currency: "INR",
          unit_cost: 4,  
          on_days: [],
          on: [],
          off: [],
          kWh: [],
          cost: []
        } 
}

let stateID = "power"

let getDataOfHours = (deviceID,raw_data,hoursCount,beforeTime,afterTime) => {
    var eventValue = raw_data[deviceID].state.power.value;
    var eventTimestamp = raw_data[deviceID].state.power.timestamp;

    //the currentTime can be used for last duration calc
    eventTimestamp.push(new Date(beforeTime).getTime());

    var hourLogs = { [deviceID]: { state: { } } }

    // Initalize monthsLogs
    hourLogs[deviceID].state[stateID] = PowerModel
    hourLogs[deviceID].state[stateID].duration.value = []
    hourLogs[deviceID].state[stateID].usage.on = []
    hourLogs[deviceID].state[stateID].usage.off = []
    hourLogs[deviceID].state[stateID].usage.kWh = []
    hourLogs[deviceID].state[stateID].usage.cost = []

    // Go through each date in a month
    var date = new Date(afterTime);
    var nextdate = new Date(afterTime);
    var lastState; //stores the last state of previous date to calc carry over duration for current date
    for(var a=0,i=0,fetchedTime = new Date(eventTimestamp[i]); a<hoursCount; a++) {
        if(a>0) date.setHours(date.getHours()+1);
        nextdate.setHours(nextdate.getHours()+1);

        var data= {
            on: 0,
            off: 0
        }

        hourLogs[deviceID].state[stateID].duration.type = "Hours"
        hourLogs[deviceID].state[stateID].duration.value.push(date.getDate()+' '+getMonthName(date.getMonth())+', '+date.getFullYear()+' '+date.getHours()+':00');

        if(lastState != undefined) {//add carry over duration
            data[lastState] += fetchedTime - date;
        }

        for(; i<eventValue.length && fetchedTime<nextdate; i++){
            data[eventValue[i]] += eventTimestamp[i+1] - eventTimestamp[i];
            lastState=eventValue[i]
            fetchedTime = new Date(eventTimestamp[i+1])
        }
        //fetchedTime will be in next date, so subtract extra duration
        if(nextdate < fetchedTime) data[lastState] -= fetchedTime - nextdate;

        var totalONhours = data.on/3600000
        var device_rating = 9
        var watt_hrs = device_rating * totalONhours
        var kWh_hrs = watt_hrs / 1000
        var unit_cost = kWh_hrs * 4

        hourLogs[deviceID].state[stateID].usage.kWh.push(kWh_hrs);
        hourLogs[deviceID].state[stateID].usage.cost.push(unit_cost);
        hourLogs[deviceID].state[stateID].usage.on.push(totalONhours*60);
        hourLogs[deviceID].state[stateID].usage.off.push(data.off/60000);
        
    }

    return hourLogs;
}

let getDataOfDays = (deviceID,raw_data,dayCount,beforeTime,afterTime) => {
    var eventValue = raw_data[deviceID].state.power.value;
    var eventTimestamp = raw_data[deviceID].state.power.timestamp;

    //the currentTime can be used for last duration calc
    eventTimestamp.push(new Date(beforeTime).getTime());

    var daysLogs = { [deviceID]: { state: { } } }

    // Initalize monthsLogs
    daysLogs[deviceID].state[stateID] = PowerModel
    daysLogs[deviceID].state[stateID].duration.value = []
    daysLogs[deviceID].state[stateID].usage.on = []
    daysLogs[deviceID].state[stateID].usage.off = []
    daysLogs[deviceID].state[stateID].usage.kWh = []
    daysLogs[deviceID].state[stateID].usage.cost = []
    //daysLogs[deviceID].state[stateID].usage.on_days = []

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

        
        daysLogs[deviceID].state[stateID].duration.type = "Days"
        daysLogs[deviceID].state[stateID].duration.value.push(date + ' ' + getMonthName(day.getMonth()))

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

        daysLogs[deviceID].state[stateID].usage.kWh.push(kWh_hrs_day)
        daysLogs[deviceID].state[stateID].usage.cost.push(unit_cost)
        daysLogs[deviceID].state[stateID].usage.on.push(totalONhours)
        daysLogs[deviceID].state[stateID].usage.off.push(data.off/3600000)
        
    }
    return daysLogs;
}

let getDataOfMonths = (deviceID,raw_data,beforeTime,afterTime) => {
    var eventValue = raw_data[deviceID].state.power.value;
    var eventTimestamp = raw_data[deviceID].state.power.timestamp;
    //the currentTime can be used for last duration calc
    eventTimestamp.push(new Date(beforeTime).getTime());

    var monthsLogs = { [deviceID]: { state: { } } }

    // Initalize monthsLogs
    monthsLogs[deviceID].state[stateID] = PowerModel
    monthsLogs[deviceID].state[stateID].duration.value = []
    monthsLogs[deviceID].state[stateID].usage.on = []
    monthsLogs[deviceID].state[stateID].usage.off = []
    monthsLogs[deviceID].state[stateID].usage.kWh = []
    monthsLogs[deviceID].state[stateID].usage.cost = []
    monthsLogs[deviceID].state[stateID].usage.on_days = []

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
        var totalHours = 24*getTotalDaysInMonth(day.getMonth(),year);

        var data= {
            on: 0,
            off: 0
        }

        monthsLogs[deviceID].state[stateID].duration.type = "Months"
        monthsLogs[deviceID].state[stateID].duration.value.push(getMonthName(day.getMonth()))

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

        monthsLogs[deviceID].state[stateID].usage.on_days.push(Math.round(totalONDays))
        monthsLogs[deviceID].state[stateID].usage.kWh.push(kWh_per_month)
        monthsLogs[deviceID].state[stateID].usage.cost.push(unit_cost)
        monthsLogs[deviceID].state[stateID].usage.on.push(totalONhours)
        monthsLogs[deviceID].state[stateID].usage.off.push(data.off/3600000)

    }
    return monthsLogs;
    
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
            afterDate = new Date(dateOb.getFullYear(),dateOb.getMonth(),dateOb.getDate(),(dateOb.getHours()-24)).toISOString()
        } else if(pvalue == 2){
            afterDate = new Date(dateOb.getFullYear(),dateOb.getMonth(),dateOb.getDate(),(dateOb.getHours()-48)).toISOString()
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
