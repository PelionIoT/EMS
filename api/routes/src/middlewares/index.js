'use strict';
const jwt = require('jsonwebtoken');

let getEnterpriseTools = (req, res, next) => {
    //Attach DCS tool
    req.dcs = require('enterprise-tools');

    //Set access token for dcs-tools
    req.dcs.setAccessObject({access_token:req.headers.authorization},
        req.headers.cloudurl || "http://api:8080",
        req.headers.accountID || null,
        req.headers['x-wigwag-identity'] ? {'x-wigwag-identity': req.headers['x-wigwag-identity']} : null
    );

    //Enable debug
    if(req.headers.enabledebug) {
        req.dcs.enableDebug(true);
    }

    next();
};

let authenticate = (req, res, next) => {
    //if the route is /web then ignore authentication
    // if(req.url.indexOf('/web') > -1) {
    //      next();
    //      return;
    // }
    //When localhost dont check authentication
    if(req.headers['x-wigwag-identity']) {
        if(req.headers['x-wigwag-authenticated']) {
            let auth = jwt.decode(req.headers.authorization.substring(7));
            req.params.accountID = auth.accounts[0];
            next();
        } else {
            res.status(401).send();
        }
    } else if(req.headers.authorization) { //This is temporary to keep developing on localhost
        //Validate if the authorization header is correct
        let auth = jwt.decode(req.headers.authorization.substring(7));
        if(auth && auth.userID && auth.accounts && auth.associationID && auth.iat) {
            req.params.accountID = auth.accounts[0];
            //console.log("sdfsdfsd");
            next();
        } else {
            res.status(401).send();
        }
    } else {
        res.status(401).send();
    }
};

module.exports = {
    getEnterpriseTools,
    authenticate
};
