const express = require('express');
const router = express.Router();

//Used when run under localhost
router.use('/ems/docs', require('./docs'));
router.use('/ems', require('./src'));
router.use('/ems/accounts/:accountID', (req, res, next) => {
    req.headers.accountID = req.params.accountID;
    next();
}, require('./src'));

//***Production

//Docs
router.use('/docs', require('./docs'));

router.use('/accounts/:accountID', (req, res, next) => {
    req.headers.accountID = req.params.accountID;
    next();
}, require('./src'));

router.use('/', require('./src'));
router.use('/src', require('./src'));

module.exports = router;
