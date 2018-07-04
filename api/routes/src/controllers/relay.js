'use strict';

let getLocation = (req, res) => {
    var data = []
    try {
        req.dcs.getRelays().then(function(arr) {
        	arr.forEach(function(resp) {
        		var latitude = parseInt(resp.coordinates.latitude)
                var longitude = parseInt(resp.coordinates.longitude)
                console.log(typeof resp.devicejsConnected)
                var relayLocation = {
                    "relayID": resp.id,
                    "latitude": latitude,
                    "longitude": longitude,
                    "devicejs" : resp.devicejsConnected
                }
                data.push(relayLocation)
        	})
        	res.status(200).send(data)
        }, function(err) {
            res.status(err.statusCode || 500).send(err.statusMessage || err);
        });
    } catch(e) {
        res.status(500).send(e);
    }
};

module.exports = {
    getLocation
}