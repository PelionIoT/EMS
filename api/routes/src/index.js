const express = require('express');
const router = express.Router();

//Middleware
const Middleware = require('./middlewares');

//All controllers load here
const EMS_Raw = require('./controllers/raw_data');
const DeviceGraphs = require('./controllers/device_graphs')  

//Developer debugging routes
router.use(require('./internal.js'));

router.get('/accounts/:accountID/sites/:siteID/:relayID/ems/raw_data',Middleware.getEnterpriseTools, EMS_Raw.getRawData);
router.get('/accounts/:accountID/sites/:siteID/:relayID/ems/device_graphs',Middleware.getEnterpriseTools, DeviceGraphs.getDeviceGraphs);


module.exports = router;