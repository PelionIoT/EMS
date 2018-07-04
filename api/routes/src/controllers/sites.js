'use strict';


function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

let siteTable = (req, res) => {
   var data = []
   var siteTable = {}
    try {
        req.dcs.getSites().then((sites) => {
            console.log(sites)
            req.dcs.getRelays().then((resp) => {
                Object.keys(sites).forEach(function(site) {
                    var relayResp = resp.find(r => r.siteID === site);
                    var siteID = sites[site].id
                    var sitename = sites[site].name
                    var relayID = "-"
                    var devicejs = "-"
                    var devicedb = "-"
                    var Cpu = "-"
                    var Memory = "-"
                    var IP = "-"
                    if(relayResp !== undefined && site === relayResp.siteID) {
                        relayID = relayResp.id
                        devicejs = relayResp.devicejsConnected
                        devicedb = relayResp.devicedbConnected
                    }
                    if(devicejs === true){
                        req.dcs.cmdDiagnostics(siteID, '-s').then(function(getDiag) {
                            if(isEmpty(getDiag)) {
                                return 0;
                            }
                            Cpu = getDiag.System.CPU
                            Memory = getDiag.System["Memory Consumed"]
                            IP = getDiag.Relay["Relay IP Address"]
                            var siteTable = {
                                "siteID": siteID,
                                "sitename": sitename,
                                "relayID": relayID,
                                "devicejs": devicejs,
                                "devicedb": devicedb,
                                "CPU": Cpu,
                                "Memory": Memory,
                                "IP": IP
                            }
                            //data.push(siteTable) 
                        }, function(err) {
                            console.log(err)
                        })
                    }else {
                        var siteTable = {
                            "siteID": siteID,
                            "sitename": sitename,
                            "relayID": relayID,
                            "devicejs": devicejs,
                            "devicedb": devicedb,
                            "CPU": Cpu,
                            "Memory": Memory,
                            "IP": IP
                        }
                        //data.push(siteTable) 
                    }
                    data.push(siteTable)
                })
                res.status(200).send(data)
            },function(err) {
                res.status(err.statusCode || 500).send(err.statusMessage || err);
           })
       }, function(err) {
            res.status(err.statusCode || 500).send(err.statusMessage || err);
       })
        
    } catch(e) {
        res.status(500).send(e);
    }
};

module.exports = {
    siteTable
}