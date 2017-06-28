var redis = require('ioredis');
var config = require('config');
var util = require('util');
var Hashids = require('hashids');
var method = config.Host.ticket_method || 'prefix';
var key = config.Host.HashKey || 'ticket';


var redisip = config.Security.ip;
var redisport = config.Security.port;
var redispass = config.Security.password;
var redismode = config.Security.mode;



var redisSetting =  {
    port:redisport,
    host:redisip,
    family: 4,
    password: redispass,
    retryStrategy: function (times) {
        var delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError: function (err) {

        return true;
    }
};

if(redismode == 'sentinel'){

    if(config.Security.sentinels && config.Security.sentinels.hosts && config.Security.sentinels.port, config.Security.sentinels.name){
        var sentinelHosts = config.Security.sentinels.hosts.split(',');
        if(Array.isArray(sentinelHosts) && sentinelHosts.length > 2){
            var sentinelConnections = [];

            sentinelHosts.forEach(function(item){

                sentinelConnections.push({host: item, port:config.Security.sentinels.port})

            })

            redisSetting = {
                sentinels:sentinelConnections,
                name: config.Security.sentinels.name
            }

        }else{

            console.log("No enough sentinel servers found .........");
        }

    }
}

var redisClient = undefined;

if(redismode != "cluster") {
    redisClient = new redis(redisSetting);
}else{

    var redisHosts = redisip.split(",");
    if(Array.isArray(redisHosts)){


        redisSetting = [];
        redisHosts.forEach(function(item){
            redisSetting.push({
                host: item,
                port: redisport,
                family: 4,
                password: redispass});
        });

        var redisClient = new redis.Cluster([redisSetting]);

    }else{

        redisClient = new redis(redisSetting);
    }


}


var hashids = new Hashids(key,10,'abcdefghijklmnopqrstuvwxyz1234567890');

redisClient.on('error', function (err) {
    console.log('Error ' + err);
});



var generate = function(company, tenant, cb) {


    var keyx = util.format('%d:%d:counter:%s', tenant, company, key);
    redisClient.incr(keyx, function (err, reply) {
        if (!err) {

            if(method == 'prefix'){

                var keyx = util.format('%d:%d:prefix:%s', tenant, company, key);
                redisClient.get(keyx, function (err, prefix) {
                    if (!err) {

                        var id = util.format('%s-%d', prefix, reply);
                        cb(true, id, reply);

                    } else {

                        cb(false);

                    }
                });

            }else{

                var id = hashids.encode(tenant, company, reply);
                cb(true, id, reply);
            }


        } else {

            cb(false);

        }

    });
}

module.exports.generate= generate;