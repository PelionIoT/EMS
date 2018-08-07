var EMS_Raw = require('./raw_data')

let getBrightnessGraphs = (req, res) => {
	var deviceID = req.query.deviceID;
    var pType = req.query.ptype;
    var pValue = req.query.pvalue;
    var state = req.query.state;
    var currentTime = new Date().toISOString();
    console.log("inside a function")

    if(pType != undefined && pType == "Year" && state == 'brightness'){
        var afterTime = getAfterDate(currentTime,"year")
        EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime, state).then((raw_data) => {
            var result = getDataOfBrightness(deviceID,raw_data,currentTime,afterTime,state);
            res.status(200).send(result);
        }, (err) => {
            console.log("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
        })
    } else if(pType != undefined && pType == "Month" && state == 'brightness' && pValue != undefined){
        var afterTime;
        if(pValue == "1M"){
            afterTime = getAfterDate(currentTime,"month",1)
            console.log(currentTime +" "+ afterTime)
            //console.log("Before Date: " + currentTime + " After Date: " + afterTime)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then((raw_data) => {
                //console.log("raw data " + JSON.stringify(raw_data, null, 4))
                //var dayCount = getTotalDaysInMonth(new Date().getMonth(),new Date().getFullYear());
                var result =  getDataOfBrightness(deviceID,raw_data,currentTime,afterTime, state)
                res.status(200).send(result);
            }, (err) => {
                console.log("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
            })
        } else if(pValue == "3M"){
            afterTime = getAfterDate(currentTime,"month",3)
            //console.log("Before Date: " + currentTime + " After Date: " + afterTime)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then(function(raw_data){
                var result = getDataOfBrightness(deviceID,raw_data,currentTime,afterTime, state)
                console.log(currentTime)
                res.status(200).send(result);
            },function(error){
                console.log(error)
                res.status(500).send("Request Failed: No response received");
            })
        } else if(pValue == "6M"){
            afterTime = getAfterDate(currentTime,"month",6)
            //console.log("Before Date: " + currentTime + " After Date: " + afterTime)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then(function(raw_data){
                var result = getDataOfBrightness(deviceID,raw_data,currentTime,afterTime,state)
                console.log(currentTime)
                res.status(200).send(result);
            },function(error){
                console.log(error)
                res.status(500).send("Request Failed: No response received");
            })
           
        } else {
            res.status(500).send("Request Failed: Invalid parameters")
        }
    } else if(pType != undefined && pType == "Days" && pValue != undefined)
    {
        var afterTime;
        if(pValue == "1D"){
            afterTime = getAfterDate(currentTime,"day",1)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then((raw_data) => {
                var result = getDataOfBrightness(deviceID,raw_data,currentTime,afterTime,state);
                res.status(200).send(result);
            }, (err) => {
                console.log("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
            })
        } else if(pValue == "2D"){
            afterTime = getAfterDate(currentTime,"day",2)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then(function(raw_data){
                var result = getDataOfBrightness(deviceID,raw_data,currentTime,afterTime,state);
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
                var result = getDataOfBrightness(deviceID,raw_data,currentTime,afterTime,state);
                res.status(200).send(result);
            }, (err) => {
                console.log("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
            })
        }
        else if(pValue == "2W"){
            afterTime = getAfterDate(currentTime,"week",2)
            EMS_Raw.getEMS_RawData(req, "asc", currentTime, afterTime).then((raw_data) => {
                var result = getDataOfBrightness(deviceID,raw_data,currentTime,afterTime,state);
                res.status(200).send(result);
            }, (err) => {
                console.log("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
            })
        } else {
            res.status(500).send("Request Failed: Invalid parameters")
        }
    }
    else 
    {
        res.status(500).send("Request Failed: Invalid parameters")
    }
}

function getDataOfBrightness(deviceID,raw_data,currentTime,afterTime,state) {

    var startMonth = new Date(currentTime).getMonth()
    var endMonth = new Date(afterTime).getMonth()
    var year = new Date().getFullYear();
    var low_state=0;
    var norm_state=0;
    var med_state=0;
    var high_state=0;
    var max_state=0;
    var totalLowHours=0;
    var totalNormHours=0;
    var totalMedHours=0;
    var totalHighHours=0;
    var totalMaxHours=0;

    var eventValue = raw_data[deviceID].state.brightness.value;
    var eventTimestamp = raw_data[deviceID].state.brightness.timestamp

    var monthLogs = {
        [deviceID] : {
            state : {
                [state]: {
                    low: [],
                    norm: [],
                    med: [],
                    high:[],
                    max: []
                }
            }
        }
    }
    for(var i=0;i<eventValue.length;i++){
       
        if((eventValue[i] >= 0 && eventValue[i] <= 0.2) && eventValue[i+1]) {
            if(eventValue[i+1]) {
                low_state += eventTimestamp[i+1] - eventTimestamp[i]
            }else{
                low_state += Date.now() - eventTimestamp[i]
            }
        }
        if((eventValue[i] >= 0.21 && eventValue[i] <= 0.4) && eventValue[i+1]) {
            if(eventValue[i+1]) {
                norm_state += eventTimestamp[i+1] - eventTimestamp[i]
            }else{
                norm_state += Date.now() - eventTimestamp[i]
            }
        }
        if((eventValue[i] >= 0.41 && eventValue[i] <= 0.6) && eventValue[i+1]) {
            if(eventValue[i+1]) {
                med_state += eventTimestamp[i+1] - eventTimestamp[i]
            }else{
                med_state += Date.now() - eventTimestamp[i]
            }
        }
        if((eventValue[i] >= 0.61 && eventValue[i] <= 0.8) && eventValue[i+1]) {
            if(eventValue[i+1]) {
                high_state += eventTimestamp[i+1] - eventTimestamp[i]
            }else{
                high_state += Date.now() - eventTimestamp[i]
            }
        }
        if((eventValue[i] >= 0.81 && eventValue[i] <= 1)) {
            if(eventValue[i+1]) {
                max_state += eventTimestamp[i+1] - eventTimestamp[i]
            }else{
                max_state += Date.now() - eventTimestamp[i]
            }
            
        }
    }
    totalLowHours = low_state/3600000
    totalNormHours = norm_state/3600000
    totalMedHours = med_state/3600000 
    totalHighHours = high_state/3600000
    totalMaxHours = max_state/3600000

    totalHours = totalLowHours + totalNormHours + totalMedHours  + totalHighHours + totalMaxHours
    totalLowHours = (totalLowHours*100)/totalHours
    totalNormHours = (totalNormHours*100)/totalHours
    totalMedHours = (totalMedHours*100)/totalHours
    totalHighHours = (totalHighHours*100)/totalHours
    totalMaxHours = (totalMaxHours*100)/totalHours

    if(totalHours == 0){
        totalLowHours = 0
        totalNormHours = 0
        totalMedHours = 0
        totalHighHours = 0
        totalMaxHours = 0
    }

    monthLogs[deviceID].state[state].low.push(totalLowHours.toFixed(2))
    monthLogs[deviceID].state[state].norm.push(totalNormHours.toFixed(2))
    monthLogs[deviceID].state[state].med.push(totalMedHours.toFixed(2))
    monthLogs[deviceID].state[state].high.push(totalHighHours.toFixed(2))
    monthLogs[deviceID].state[state].max.push(totalMaxHours.toFixed(2))
    return monthLogs
}

function monthDiff(d1, d2) {
    var months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth() + 1;
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
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
          afterDate = new Date(dateOb.getFullYear(),(dateOb.getMonth()-1),(dateOb.getDate()),dateOb.getHours(),dateOb.getMinutes(),dateOb.getSeconds(),dateOb.getMilliseconds()).toISOString()
      } else if(pvalue == 3){
          afterDate = new Date(dateOb.getFullYear(),(dateOb.getMonth()-3),(dateOb.getDate()),dateOb.getHours(),dateOb.getMinutes(),dateOb.getSeconds(),dateOb.getMilliseconds()).toISOString()
      } else if(pvalue == 6){
          afterDate = new Date(dateOb.getFullYear(),(dateOb.getMonth()-6),(dateOb.getDate()),dateOb.getHours(),dateOb.getMinutes(),dateOb.getSeconds(),dateOb.getMilliseconds()).toISOString()
      }
    } else if(ptype == "year"){
          afterDate = new Date((dateOb.getFullYear()-1),dateOb.getMonth(),(dateOb.getDate()),dateOb.getHours(),dateOb.getMinutes(),dateOb.getSeconds(),dateOb.getMilliseconds()).toISOString()
    }
    return afterDate
}

module.exports = {
	getBrightnessGraphs
}