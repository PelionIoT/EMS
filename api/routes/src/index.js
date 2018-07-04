const express = require('express');
const router = express.Router();

//Middleware
const Middleware = require('./middlewares');

//All controllers load here
const EMS = require('./controllers/ems_data');

//Developer debugging routes
router.use(require('./internal.js'));

router.get('/accounts/:accountID/sites/:siteID/ems_data',Middleware.getEnterpriseTools, EMS.getEMSData);

module.exports = router;