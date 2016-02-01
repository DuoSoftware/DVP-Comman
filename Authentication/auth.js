var redis = require('redis');
var config = require('config');
var resource = config.Host.resource;


var redisip = config.Redis.ip;
var redisport = config.Redis.port;

var redisClient = redis.createClient(redisport, redisip);

redisClient.on('error', function (err) {
    console.log('Error ' + err);
});

var Autherize = function(req, payload, done){


    var issuer = payload.iss;
    var jti = payload.jti;


    redisClient.get("token:iss:"+issuer+":"+jti, function(err, key) {

        if (err) { return done(err); }
        if (!key) { return done(new Error('missing_secret')); }


        if (payload.scope.indexOf(resource) > -1) {

            done(null, key);

        } else {

            done(new Error('Not in the scope'));

        }




    });


};

module.exports.Autherize = Autherize;