var redis = require('redis');
var config = require('config');
var resource = config.Host.resource;


var redisip = config.Security.ip;
var redisport = config.Security.port;
var redisuser = config.Security.user;
var redispass = config.Security.password;


//[redis:]//[user][:password@][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]
//redis://user:secret@localhost:6379


var redisClient = redis.createClient(redisport, redisip);

redisClient.on('error', function (err) {
    console.log('Error ' + err);
});

redisClient.auth(redispass, function (error) {

    if(error != null) {
        console.log("Error Redis : " + error);
    }
});

var Secret = function(req, payload, done){


    if(payload && payload.iss && payload.jti) {
        var issuer = payload.iss;
        var jti = payload.jti;


        redisClient.get("token:iss:" + issuer + ":" + jti, function (err, key) {

            if (err) {
                return done(err);
            }
            if (!key) {
                return done(new Error('missing_secret'));
            }
            return done(null, key);


        });
    }else{
        done(new Error('wrong token format'));


    }




};



module.exports.Secret = Secret;
