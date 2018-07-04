const express = require('express');
const router = express.Router();

//Middleware
const Middleware = require('./middlewares');

//All controllers load here
const Relay = require('./controllers/relay');
const Site = require('./controllers/sites')
// const Siteinfo = require('./controllers/siteinfo');

//Developer debugging routes
router.use(require('./internal.js'));


router.get('/relayLocation', Middleware.getEnterpriseTools, Relay.getLocation);
router.get('/siteData', Middleware.getEnterpriseTools, Site.siteTable);

module.exports = router;