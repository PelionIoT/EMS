const express = require('express');
const router = express.Router();

//Middleware
const Middleware = require('./middlewares');

//All controllers load here
const EMS_Raw = require('./controllers/raw_data');
const BST_Data = require('./controllers/binaryStateTimeData')  

//Developer debugging routes
router.use(require('./internal.js'));

router.get('/accounts/:accountID/sites/:siteID/ems/raw_data',Middleware.getEnterpriseTools, EMS_Raw.getEMS_RawData);
router.get('/accounts/:accountID/sites/:siteID/ems/binarystatetimedata',Middleware.getEnterpriseTools, BST_Data.binaryStateTimeData);


module.exports = router;