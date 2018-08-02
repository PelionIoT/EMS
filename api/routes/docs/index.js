'use strict';

const express = require('express');
const router = express.Router();
router.use('/', express.static(__dirname + '/swagger-ui/dist'));
router.use('/ems-swagger.yaml', (req, res) => {
    if(req.headers.host.indexOf('localhost:') > -1) {
        res.sendFile(__dirname + '/local-ems-doc.yaml');
    } else {
        res.sendFile(__dirname + '/ems-doc.yaml');
    }
});

module.exports = router;