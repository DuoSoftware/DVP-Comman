var redis = require('redis');
var config = require('config');
var util = require('util');
var Hashids = require('hashids');
var redisip = config.Security.ip;
var redisport = config.Security.port;
var redispass = config.Security.password;

var key = config.Host.HashKey || 'ticket';

var redisClient = redis.createClient(redisport, redisip);
var hashids = new Hashids(key,10,'abcdefghijklmnopqrstuvwxyz1234567890');

redisClient.on('error', function (err) {
    console.log('Error ' + err);
});

redisClient.auth(redispass, function (error) {

    if(error != null) {
        console.log("Error Redis : " + error);
    }
});



var generate = function(company, tenant, cb) {


    var key = util.format('%d:%d:counter:%s', tenant, company, key);
    redisClient.incr(key, function (err, reply) {
        if (!err) {
            var id = hashids.encode(tenant, company, reply);
            cb(true, id);
        } else {

            cb(false);

        }

    });
}

module.exports.generate= generate;