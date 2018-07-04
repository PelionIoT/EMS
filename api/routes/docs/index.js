'use strict';

const express = require('express');
const router = express.Router();
router.use('/', express.static(__dirname + '/swagger-ui/dist'));
router.use('/emc-swagger.yaml', (req, res) => {
    if(req.headers.host.indexOf('localhost:') > -1) {
        res.sendFile(__dirname + '/local-emc-doc.yaml');
    } else {
        res.sendFile(__dirname + '/emc-doc.yaml');
    }
});

module.exports = router;