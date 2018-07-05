var EMS_Raw = require('./raw_data')

let binaryStateTimeData = (req, res) => {
    
    EMS_Raw.getEMS_RawData(req,res).then(function(response){
        //console.log(response);
        res.status(200).send(response);
    });
	
}

module.exports ={
	binaryStateTimeData
}