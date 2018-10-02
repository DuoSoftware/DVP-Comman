/**
 * Created by Marlon on 2/10/2018.
 */

var redisHandler = require('./RedisHandler');
var pgHandler = require('dvp-dbmodels');
var async = require('async');
var config = require('config');

var DBs = config.HealthCheck.DBs.split(',');
var timeout = config.HealthCheck.timeout;


var check = function (cb) {
    async.parallel({
        redis: function (callback) {
            if (DBs.includes("redis")) {

                var redisChecked = false;

                redisHandler.client.ping(function (err, result) {
                    if (!redisChecked) {
                        redisChecked = true;
                        callback(err, result);
                    }
                });

                setTimeout(function () {
                    if (!redisChecked) {
                        redisChecked = true;
                        callback('Redis healthcheck timedout');
                    }
                }, timeout);
            }
            else {
                callback(null, "Redis check skipped");
            }
        },
        pg: function (callback) {
            if (DBs.includes("pg")) {

                var pgChecked = false;

                pgHandler.SequelizeConn.authenticate().then((res) => {
                    if (!pgChecked) {
                        pgChecked = true;
                        callback(null, res);
                    }
                }).catch(function (err) {
                    if (!pgChecked) {
                        pgChecked = true;
                        callback(err);
                    }
                });

                setTimeout(function () {
                    if (!pgChecked) {
                        pgChecked = true;
                        callback('pg healthcheck timedout');
                    }
                }, timeout);
            }

            else {
                callback(null, "PG check skipped");
            }}
    }, function(err, results) {
        cb(err, results);

    });
};

module.exports.check = check;
