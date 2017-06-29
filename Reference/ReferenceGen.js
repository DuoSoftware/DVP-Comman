var redis = require('ioredis');
var config = require('config');
var util = require('util');
var Hashids = require('hashids');
var method = config.Host.ticket_method || 'prefix';
var key = config.Host.HashKey || 'ticket';


var redisip = config.Redis.ip;
var redisport = config.Redis.port;
var redispass = config.Redis.password;
var redismode = config.Redis.mode;
var redisdb = config.Redis.db;



var redisSetting =  {
    port:redisport,
    host:redisip,
    family: 4,
    password: redispass,
    db: redisdb,
    retryStrategy: function (times) {
        var delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError: function (err) {

        return true;
    }
};

if(redismode == 'sentinel'){

    if(config.Redis.sentinels && config.Redis.sentinels.hosts && config.Redis.sentinels.port, config.Redis.sentinels.name){
        var sentinelHosts = config.Redis.sentinels.hosts.split(',');
        if(Array.isArray(sentinelHosts) && sentinelHosts.length > 2){
            var sentinelConnections = [];

            sentinelHosts.forEach(function(item){

                sentinelConnections.push({host: item, port:config.Redis.sentinels.port})

            })

            redisSetting = {
                sentinels:sentinelConnections,
                name: config.Redis.sentinels.name,
                password: redispass
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