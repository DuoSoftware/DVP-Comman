/**
 * Created by dinusha on 7/28/2016.
 */
var redis = require("redis");
var Config = require('config');
var Redlock = require('redlock');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var dbmodel = require('dvp-dbmodels');

var redisIp = Config.Redis.ip;
var redisPort = Config.Redis.port;
var password = Config.Redis.password;

var client = redis.createClient(redisPort, redisIp);

client.select(10, function() { /* ... */ });

client.auth(password, function (error) {
    console.log("Redis Auth Error : "+error);
});
client.on("error", function (err) {
    console.log("Error " + err);

});

var redlock = new Redlock(
    [client],
    {
        driftFactor: 0.01,
        retryCount:  3,
        retryDelay:  200
    }
);

redlock.on('clientError', function(err)
{
    logger.error('[DVP-ClusterConfiguration.AcquireLock] - [%s] - REDIS LOCK FAILED', err);

});

var addClusterToCache = function(clusterId)
{
    var ttl = 2000;
    var lockKey = 'CLOUDLOCK:' + clusterId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {

        dbmodel.Cloud.find({where: [{id: clusterId}], include: [{model: dbmodel.LoadBalancer, as: "LoadBalancer"}]})
            .then(function (cloudRec)
            {
                if (cloudRec)
                {
                    client.set('CLOUD:' + clusterId, JSON.stringify(cloudRec), function(err, setResp)
                    {
                        lock.unlock()
                            .catch(function(err) {
                                logger.error('[DVP-ClusterConfiguration.checkAndSetCallServerToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                            });
                    });
                }
                else
                {
                    lock.unlock()
                        .catch(function(err) {
                            logger.error('[DVP-ClusterConfiguration.checkAndSetCallServerToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                        });
                }

            }).catch(function(err)
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.checkAndSetCallServerToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });
            });
    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.addClusterToCache] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });

};

var addTrunkToCache = function(trunkId)
{
    var ttl = 2000;
    var lockKey = 'TRUNKLOCK:' + trunkId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        dbModel.Trunk.find({ where:[{id: trunkId}], include : [{model: dbModel.TrunkIpAddress, as: "TrunkIpAddress"}]})
            .then(function (trunk)
            {
                if (trunk)
                {
                    client.set('TRUNK:' + trunkId, JSON.stringify(trunk), function(err, setResp)
                    {
                        lock.unlock()
                            .catch(function(err) {
                                logger.error('[DVP-ClusterConfiguration.addTrunkToCache] - [%s] - REDIS LOCK RELEASE FAILED', err);
                            });
                    });
                }
                else
                {
                    lock.unlock()
                        .catch(function(err) {
                            logger.error('[DVP-ClusterConfiguration.addTrunkToCache] - [%s] - REDIS LOCK RELEASE FAILED', err);
                        });
                }

            }).catch(function(err)
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.addTrunkToCache] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });
            });
    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.addTrunkToCache] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });

};

var addSipProfileToCompanyObj = function(profileObj, tenantId, companyId)
{
    var ttl = 2000;

    var lockKey = 'DVPCACHELOCK:' + tenantId + ':' + companyId;

    var key = 'DVPCACHE:' + tenantId + ':' + companyId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        client.get(key, function(err, compStr)
        {
            var compObj = {};
            if(compStr)
            {
                try
                {
                    compObj = JSON.parse(compStr);
                }
                catch(ex)
                {
                    compObj = {};

                }

            }

            if(!compObj.SipNetworkProfile)
            {
                compObj.SipNetworkProfile = {};
            }

            compObj.SipNetworkProfile[profileObj.id] = profileObj;

            client.set(key, JSON.stringify(compObj), function(err, compObj)
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.addSipProfileToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });

            });
        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.addSipProfileToCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};

var addCloudEndUserToCompanyObj = function(euObj, tenantId, companyId)
{
    var ttl = 2000;

    var lockKey = 'DVPCACHELOCK:' + tenantId + ':' + companyId;

    var key = 'DVPCACHE:' + tenantId + ':' + companyId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        client.get(key, function(err, compStr)
        {
            var compObj = {};
            if(compStr)
            {
                try
                {
                    compObj = JSON.parse(compStr);
                }
                catch(ex)
                {
                    compObj = {};

                }

            }

            if(!compObj.CloudEndUser)
            {
                compObj.CloudEndUser = {};
            }

            compObj.CloudEndUser[euObj.id] = euObj;

            client.set(key, JSON.stringify(compObj), function(err, compObj)
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.addCloudEndUserToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });

            });
        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.addCloudEndUserToCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};

var removeCloudEndUserFromCompanyObj = function(euId, tenantId, companyId)
{
    var ttl = 2000;

    var lockKey = 'DVPCACHELOCK:' + tenantId + ':' + companyId;

    var key = 'DVPCACHE:' + tenantId + ':' + companyId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        client.get(key, function(err, compStr)
        {
            var compObj = {};
            if(compStr)
            {
                try
                {
                    compObj = JSON.parse(compStr);
                }
                catch(ex)
                {
                    compObj = {};

                }

            }

            if(compObj.CloudEndUser && compObj.CloudEndUser[euId])
            {
                delete compObj.CloudEndUser[euId];
                client.set(key, JSON.stringify(compObj), function(err, compObj)
                {
                    lock.unlock()
                        .catch(function(err) {
                            logger.error('[DVP-ClusterConfiguration.removeCloudEndUserFromCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                        });

                });
            }
            else
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.removeCloudEndUserFromCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });
            }


        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.removeCloudEndUserFromCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};


var addCallRuleToCompanyObj = function(ruleObj, tenantId, companyId)
{
    var ttl = 2000;

    var lockKey = 'DVPCACHELOCK:' + tenantId + ':' + companyId;

    var key = 'DVPCACHE:' + tenantId + ':' + companyId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        client.get(key, function(err, compStr)
        {
            var compObj = {};
            if(compStr)
            {
                try
                {
                    compObj = JSON.parse(compStr);
                }
                catch(ex)
                {
                    compObj = {};

                }

            }

            if(!compObj.CallRule)
            {
                compObj.CallRule = {};
            }

            compObj.CallRule[ruleObj.id] = ruleObj;

            client.set(key, JSON.stringify(compObj), function(err, compObj)
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.addCallRuleToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });

            });
        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.addCallRuleToCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};

var removeCallRuleFromCompanyObj = function(ruleId, tenantId, companyId)
{
    var ttl = 2000;

    var lockKey = 'DVPCACHELOCK:' + tenantId + ':' + companyId;

    var key = 'DVPCACHE:' + tenantId + ':' + companyId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        client.get(key, function(err, compStr)
        {
            var compObj = {};
            if(compStr)
            {
                try
                {
                    compObj = JSON.parse(compStr);
                }
                catch(ex)
                {
                    compObj = {};

                }

            }

            if(compObj.CallRule && compObj.CallRule[ruleId])
            {
                delete compObj.CallRule[ruleId];
                client.set(key, JSON.stringify(compObj), function(err, compObj)
                {
                    lock.unlock()
                        .catch(function(err) {
                            logger.error('[DVP-ClusterConfiguration.removeCallRuleFromCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                        });

                });
            }
            else
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.removeCallRuleFromCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });
            }


        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.removeCloudEndUserFromCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};

var addApplicationToCompanyObj = function(appObj, tenantId, companyId)
{
    var ttl = 2000;

    var lockKey = 'DVPCACHELOCK:' + tenantId + ':' + companyId;

    var key = 'DVPCACHE:' + tenantId + ':' + companyId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        client.get(key, function(err, compStr)
        {
            var compObj = {};
            if(compStr)
            {
                try
                {
                    compObj = JSON.parse(compStr);
                }
                catch(ex)
                {
                    compObj = {};

                }

            }

            if(!compObj.Application)
            {
                compObj.Application = {};
            }

            compObj.Application[appObj.id] = appObj;

            client.set(key, JSON.stringify(compObj), function(err, compObj)
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.addApplicationToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });

            });
        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.addApplicationToCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};

var removeApplicationFromCompanyObj = function(appId, tenantId, companyId)
{
    var ttl = 2000;

    var lockKey = 'DVPCACHELOCK:' + tenantId + ':' + companyId;

    var key = 'DVPCACHE:' + tenantId + ':' + companyId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        client.get(key, function(err, compStr)
        {
            var compObj = {};
            if(compStr)
            {
                try
                {
                    compObj = JSON.parse(compStr);
                }
                catch(ex)
                {
                    compObj = {};

                }

            }

            if(compObj.Application && compObj.Application[appId])
            {
                delete compObj.Application[appId];
                client.set(key, JSON.stringify(compObj), function(err, compObj)
                {
                    lock.unlock()
                        .catch(function(err) {
                            logger.error('[DVP-ClusterConfiguration.removeApplicationFromCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                        });

                });
            }
            else
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.removeApplicationFromCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });
            }


        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.removeCloudEndUserFromCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};

var addTranslationToCompanyObj = function(transObj, tenantId, companyId)
{
    var ttl = 2000;

    var lockKey = 'DVPCACHELOCK:' + tenantId + ':' + companyId;

    var key = 'DVPCACHE:' + tenantId + ':' + companyId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        client.get(key, function(err, compStr)
        {
            var compObj = {};
            if(compStr)
            {
                try
                {
                    compObj = JSON.parse(compStr);
                }
                catch(ex)
                {
                    compObj = {};

                }

            }

            if(!compObj.Translation)
            {
                compObj.Translation = {};
            }

            compObj.Translation[transObj.id] = transObj;

            client.set(key, JSON.stringify(compObj), function(err, compObj)
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.addTranslationToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });

            });
        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.addTranslationToCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};

var removeTranslationFromCompanyObj = function(transId, tenantId, companyId)
{
    var ttl = 2000;

    var lockKey = 'DVPCACHELOCK:' + tenantId + ':' + companyId;

    var key = 'DVPCACHE:' + tenantId + ':' + companyId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        client.get(key, function(err, compStr)
        {
            var compObj = {};
            if(compStr)
            {
                try
                {
                    compObj = JSON.parse(compStr);
                }
                catch(ex)
                {
                    compObj = {};

                }

            }

            if(compObj.Translation && compObj.Translation[transId])
            {
                delete compObj.Translation[transId];
                client.set(key, JSON.stringify(compObj), function(err, compObj)
                {
                    lock.unlock()
                        .catch(function(err) {
                            logger.error('[DVP-ClusterConfiguration.removeApplicationFromCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                        });

                });
            }
            else
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.removeApplicationFromCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });
            }


        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.removeCloudEndUserFromCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};


var addTransferCodeToCompanyObj = function(tcObj, tenantId, companyId)
{
    var ttl = 2000;

    var lockKey = 'DVPCACHELOCK:' + tenantId + ':' + companyId;

    var key = 'DVPCACHE:' + tenantId + ':' + companyId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        client.get(key, function(err, compStr)
        {
            var compObj = {};
            if(compStr)
            {
                try
                {
                    compObj = JSON.parse(compStr);
                }
                catch(ex)
                {
                    compObj = {};

                }

            }

            if(!compObj.TransferCode)
            {
                compObj.TransferCode = {};
            }

            compObj.TransferCode = tcObj;

            client.set(key, JSON.stringify(compObj), function(err, compObjResp)
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.addTransferCodeToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });

            });
        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.addTransferCodeToCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};

var removeTransferCodeFromCompanyObj = function(tenantId, companyId)
{
    var ttl = 2000;

    var lockKey = 'DVPCACHELOCK:' + tenantId + ':' + companyId;

    var key = 'DVPCACHE:' + tenantId + ':' + companyId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        client.get(key, function(err, compStr)
        {
            var compObj = {};
            if(compStr)
            {
                try
                {
                    compObj = JSON.parse(compStr);
                }
                catch(ex)
                {
                    compObj = {};

                }

            }

            if(compObj.TransferCode)
            {
                delete compObj.TransferCode;
                client.set(key, JSON.stringify(compObj), function(err, compObjResp)
                {
                    lock.unlock()
                        .catch(function(err) {
                            logger.error('[DVP-ClusterConfiguration.removeCloudEndUserFromCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                        });

                });
            }
            else
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.removeCloudEndUserFromCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });
            }


        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.removeCloudEndUserFromCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};

var removeSipProfileFromCompanyObj = function(profileId, tenantId, companyId)
{
    var ttl = 2000;

    var lockKey = 'DVPCACHELOCK:' + tenantId + ':' + companyId;

    var key = 'DVPCACHE:' + tenantId + ':' + companyId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        client.get(key, function(err, compStr)
        {
            var compObj = {};
            if(compStr)
            {
                try
                {
                    compObj = JSON.parse(compStr);
                }
                catch(ex)
                {
                    compObj = {};

                }

            }

            if(compObj.SipNetworkProfile && compObj.SipNetworkProfile[profileId])
            {
                delete compObj.SipNetworkProfile[profileId];
                client.set(key, JSON.stringify(compObj), function(err, compObj)
                {
                    lock.unlock()
                        .catch(function(err) {
                            logger.error('[DVP-ClusterConfiguration.addSipProfileToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                        });

                });
            }
            else
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.addSipProfileToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });
            }


        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.addSipProfileToCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};

var addCallServerToCompanyObj = function(newCsObj, tenantId, companyId)
{
    var ttl = 2000;

    var lockKey = 'DVPCACHELOCK:' + tenantId + ':' + companyId;

    var key = 'DVPCACHE:' + tenantId + ':' + companyId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        client.get(key, function(err, compStr)
        {
            var compObj = {};
            if(compStr)
            {
                try
                {
                    compObj = JSON.parse(compStr);
                }
                catch(ex)
                {
                    compObj = {};

                }

            }

            if(!compObj.CallServer)
            {
                compObj.CallServer = {};
            }

            compObj.CallServer[newCsObj.id] = newCsObj;

            client.set(key, JSON.stringify(compObj), function(err, compObj)
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.checkAndSetCallServerToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });

            });
        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.checkAndSetCallServerToCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};

var addContextToCache = function(context, contextObj)
{
    try
    {
        var key = 'CONTEXT:' + context;

        client.set(key, JSON.strigify(contextObj), function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var removeContextFromCache = function(context)
{
    try
    {
        var key = 'CONTEXT:' + context;

        client.del(key, function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var addTrunkNumberByIdToCache = function(trNumId, companyId, tenantId, trunkNumObj)
{
    try
    {
        var key = 'TRUNKNUMBERBYID:' + tenantId + ':' + companyId + ':' + trNumId;

        client.set(key, JSON.strigify(trunkNumObj), function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var addTrunkNumberToCache = function(trNumber, trunkNumObj)
{
    try
    {
        var key = 'TRUNKNUMBER:' + trNumber;

        client.set(key, JSON.strigify(trunkNumObj), function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var addDidNumberToCache = function(didNumber, companyId, tenantId, didNumObj)
{
    try
    {
        var key = 'DIDNUMBER:' + tenantId + ':' + companyId + ':' + didNumber;

        client.set(key, JSON.strigify(didNumObj), function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var removeDidNumberFromCache = function(didNumber, companyId, tenantId)
{
    try
    {
        var key = 'DIDNUMBER:' + tenantId + ':' + companyId + ':' + didNumber;

        client.del(key, function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var removePBXUserFromCache = function(pabxUserUuid, companyId, tenantId)
{
    try
    {
        var key = 'PBXUSER:' + tenantId + ':' + companyId + ':' + pabxUserUuid;

        client.del(key, function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var addLimitToCache = function(limitId, companyId, tenantId, limObj)
{
    try
    {
        var key = 'LIMIT:' + tenantId + ':' + companyId + ':' + limitId;

        client.set(key, JSON.strigify(limObj), function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var removeLimitFromCache = function(limitId, companyId, tenantId)
{
    try
    {
        var key = 'LIMIT:' + tenantId + ':' + companyId + ':' + limitId;

        client.del(key, function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var addNumberBLToCache = function(blNumber, companyId, tenantId, blObj)
{
    try
    {
        var key = 'NUMBERBLACKLIST:' + tenantId + ':' + companyId + ':' + blNumber;

        client.set(key, JSON.strigify(blObj), function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var removeNumberBLFromCache = function(blNumber, companyId, tenantId)
{
    try
    {
        var key = 'NUMBERBLACKLIST:' + tenantId + ':' + companyId + ':' + blNumber;

        client.del(key, function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var removeTrunkNumberByIdFromCache = function(trNumId, companyId, tenantId)
{
    try
    {
        var key = 'TRUNKNUMBERBYID:' + tenantId + ':' + companyId + ':' + trNumId;

        client.del(key, function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var removeTrunkNumberFromCache = function(trNumber)
{
    try
    {
        var key = 'TRUNKNUMBER:' + trNumber;

        client.del(key, function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var addCallServerByIdToCache = function(csId, csObj)
{
    try
    {
        var key = 'CALLSERVER:' + csId;

        client.set(key, JSON.strigify(csObj), function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var addExtensionToCache = function(extensionObj, companyId, tenantId)
{
    //Add Extension By ID Single Object

    try
    {
        if(extensionObj.id)
        {
            var keyExtById = 'EXTENSIONBYID:' + tenantId + ':' + companyId + ':' + extensionObj.id;

            client.set(keyExtById, JSON.strigify(extensionObj), function(err, response)
            {

            });
        }


    }
    catch(ex)
    {

    }

    //Check Extension Type if group load Group -> Ext Object
    //if group user add SipUser -> Ext Obj

    try
    {
        if(extensionObj.ObjCategory && extensionObj.Extension)
        {
            var keyExt = 'EXTENSION:' + tenantId + ':' + companyId + ':' + extensionObj.Extension;
            if(extensionObj.ObjCategory === 'USER')
            {
                dbmodel.Extension.find({where: [{Extension: extensionObj.Extension},{TenantId: tenantId},{CompanyId:companyId}], include: [{model: dbmodel.SipUACEndpoint, as:'SipUACEndpoint'}]})
                    .then(function (resExt)
                    {
                        client.set(keyExt, JSON.strigify(resExt), function(err, response)
                        {

                        });

                        if(resExt.SipUACEndpoint && resExt.SipUACEndpoint.id)
                        {
                            //add sip user by id object
                            var keySipUserById = 'SIPUSERBYID:' + tenantId + ':' + companyId + ':' + resExt.SipUACEndpoint.id;
                            var keySipUserByName = 'SIPUSER:' + resExt.SipUACEndpoint.SipUsername;


                            dbmodel.SipUACEndpoint.find({where: [{id: resExt.SipUACEndpoint.id}], include: [{model: dbmodel.Extension, as:'Extension'}]})
                                .then(function (resUser)
                                {
                                    client.set(keySipUserById, JSON.strigify(resUser), function(err, response)
                                    {

                                    });

                                    if(resExt.SipUACEndpoint.SipUsername)
                                    {
                                        client.set(keySipUserByName, JSON.strigify(resUser), function(err, response)
                                        {

                                        });
                                    }


                                }).catch(function(err)
                                {

                                });




                        }

                    }).catch(function(err)
                    {
                    });

            }
            else if(extensionObj.ObjCategory === 'GROUP')
            {
                dbmodel.Extension.find({where: [{Extension: extensionObj.Extension},{TenantId: tenantId},{CompanyId:companyId}], include: [{model: dbmodel.UserGroup, as:'UserGroup'}]})
                    .then(function (resExt)
                    {
                        client.set(keyExt, JSON.strigify(resExt), function(err, response)
                        {

                        });

                        if(resExt.UserGroup && resExt.UserGroup.id)
                        {
                            //add sip user by id object
                            var keyGroupById = 'USERGROUP:' + tenantId + ':' + companyId + ':' + resExt.UserGroup.id;

                            dbmodel.UserGroup.find({where: [{id: resExt.UserGroup.id}], include: [{model: dbmodel.Extension, as:'Extension'},{model: dbmodel.SipUACEndpoint, as:'SipUACEndpoint'}]})
                                .then(function (resGrp)
                                {
                                    client.set(keyGroupById, JSON.strigify(resGrp), function(err, response)
                                    {

                                    });
                                }).catch(function(err)
                                {

                                });

                        }

                    }).catch(function(err)
                    {
                    });

            }
            else if(extensionObj.ObjCategory === 'CONFERENCE')
            {
                dbmodel.Extension.find({where: [{Extension: extensionObj.Extension},{TenantId: tenantId},{CompanyId:companyId}], include: [{model: dbmodel.Conference, as:'Conference'}]})
                    .then(function (resExt)
                    {
                        client.set(keyExt, JSON.strigify(resExt), function(err, response)
                        {

                        });

                    }).catch(function(err)
                    {
                    });

            }
            else
            {

                client.set(keyExt, JSON.strigify(extensionObj), function(err, response)
                {

                });
            }




        }


    }
    catch(ex)
    {

    }
};

var addSipUserToCache = function(sipUserObj, companyId, tenantId)
{
    try
    {
        if(sipUserObj.id)
        {
            var keySipUserById = 'SIPUSERBYID:' + tenantId + ':' + companyId + ':' + sipUserObj.id;

            dbmodel.SipUACEndpoint.find({where: [{id: sipUserObj.id, TenantId: tenantId, CompanyId: companyId}], include: [{model: dbmodel.Extension, as:'Extension'}]})
                .then(function (resUser)
                {
                    client.set(keySipUserById, JSON.strigify(resUser), function(err, response)
                    {

                    });

                    if(resUser.SipUsername)
                    {
                        var keySipUserByName = 'SIPUSER:' + resUser.SipUsername;
                        client.set(keySipUserByName, JSON.strigify(resUser), function(err, response)
                        {

                        });
                    }

                    if(resUser.Extension && resUser.Extension.id)
                    {
                        dbmodel.Extension.find({where: [{id: resUser.Extension.id},{TenantId: tenantId},{CompanyId:companyId}], include: [{model: dbmodel.SipUACEndpoint, as:'SipUACEndpoint'}]})
                            .then(function (resExt)
                            {
                                var keyExt = 'EXTENSION:' + tenantId + ':' + companyId + ':' + resExt.Extension;

                                client.set(keyExt, JSON.strigify(resExt), function(err, response)
                                {

                                });

                            });
                    }
                }).catch(function(err)
                {

                });
        }


    }
    catch(ex)
    {

    }
};

var addGroupToCache = function(groupObj, companyId, tenantId)
{

    try
    {
        if(groupObj.id)
        {
            var keyGroupById = 'USERGROUP:' + tenantId + ':' + companyId + ':' + groupObj.id;

            dbmodel.UserGroup.find({where: [{id: groupObj.id, CompanyId: companyId, TenantId: tenantId}], include: [{model: dbmodel.Extension, as:'Extension'},{model: dbmodel.SipUACEndpoint, as:'SipUACEndpoint'}]})
                .then(function (resGrp)
                {
                    client.set(keyGroupById, JSON.strigify(resGrp), function(err, response)
                    {

                    });

                    if(resGrp.Extension && resGrp.Extension.id)
                    {
                        dbmodel.Extension.find({where: [{id: resGrp.Extension.id},{TenantId: tenantId},{CompanyId:companyId}], include: [{model: dbmodel.UserGroup, as:'UserGroup'}]})
                            .then(function (resExt)
                            {
                                var keyExt = 'EXTENSION:' + tenantId + ':' + companyId + ':' + resExt.Extension;
                                client.set(keyExt, JSON.strigify(resExt), function(err, response)
                                {

                                });

                            }).catch(function(err)
                            {

                            });
                    }

                }).catch(function(err)
                {

                });
        }


    }
    catch(ex)
    {

    }

};

var removeGroupFromCache = function(groupId, companyId, tenantId)
{

    try
    {
        if(groupId)
        {
            var keyGroupById = 'USERGROUP:' + tenantId + ':' + companyId + ':' + groupId;

            client.get(keyGroupById, function(err, grpCacheStr)
            {
                var grpCache = null;

                grpCache = JSON.parse(grpCacheStr);

                client.del(keyGroupById, function(err, response)
                {

                });

                if(grpCache && grpCache.Extension && grpCache.Extension.Extension)
                {
                    var keyExt = 'EXTENSION:' + tenantId + ':' + companyId + ':' + grpCache.Extension.Extension;
                    client.get(keyExt, function(err, extCacheStr)
                    {
                        var extCache = null;

                        extCache = JSON.parse(extCacheStr);

                        if(extCache)
                        {
                            extCache.UserGroup = null;
                        }

                        client.set(keyExt, JSON.strigify(extCache), function(err, response)
                        {

                        });
                    });
                }

            });

        }


    }
    catch(ex)
    {

    }

};

var removeExtensionFromCache = function(extension, companyId, tenantId)
{

    try
    {
        if(extension)
        {
            var keyExt = 'EXTENSION:' + tenantId + ':' + companyId + ':' + extension;

            client.get(keyExt, function(err, extCacheStr)
            {
                var extCache = null;

                extCache = JSON.parse(extCacheStr);

                client.del(keyExt, function(err, response)
                {

                });

                if(extCache && extCache.id)
                {
                    var keyExtById = 'EXTENSIONBYID:' + tenantId + ':' + companyId + ':' + extCache.id;

                    client.del(keyExtById, function(err, response)
                    {

                    });

                    if(extCache.ObjCategory === 'USER' && extCache.SipUACEndpoint)
                    {
                        if(extCache.SipUACEndpoint.id)
                        {
                            var keySipUserById = 'SIPUSERBYID:' + tenantId + ':' + companyId + ':' + extCache.SipUACEndpoint.id;

                            client.get(keySipUserById, function(err, usrCacheByIdStr)
                            {
                                var usrCacheById = null;

                                usrCacheById = JSON.parse(usrCacheByIdStr);

                                if(usrCacheById)
                                {
                                    usrCacheById.Extension = null;

                                    client.set(keySipUserById, JSON.strigify(usrCacheById), function(err, response)
                                    {

                                    });
                                }


                            });
                        }

                        if(extCache.SipUACEndpoint.SipUsername)
                        {
                            var keySipUser = 'SIPUSER:' + extCache.SipUACEndpoint.SipUsername;

                            client.get(keySipUser, function(err, usrCacheStr)
                            {
                                var usrCache = null;

                                usrCache = JSON.parse(usrCacheStr);

                                if(usrCache)
                                {
                                    usrCache.Extension = null;

                                    client.set(keySipUser, JSON.strigify(usrCache), function(err, response)
                                    {

                                    });
                                }


                            });
                        }



                    }
                    else if(extCache.ObjCategory === 'GROUP' && extCache.UserGroup && extCache.UserGroup.id)
                    {
                        var keyGroupById = 'USERGROUP:' + tenantId + ':' + companyId + ':' + extCache.UserGroup.id;

                        client.get(keyGroupById, function(err, grpCacheByIdStr)
                        {
                            var grpCacheById = null;

                            grpCacheById = JSON.parse(grpCacheByIdStr);

                            if(grpCacheById)
                            {
                                grpCacheById.Extension = null;

                                client.set(keyGroupById, JSON.strigify(grpCacheById), function(err, response)
                                {

                                });
                            }


                        });


                    }


                }

            });

        }


    }
    catch(ex)
    {

    }

};

var addConferenceToCache = function(conferenceObj, companyId, tenantId)
{
    try
    {
        if(conferenceObj.ConferenceName)
        {
            var keyConference = 'CONFERENCE:' + tenantId + ':' + companyId + ':' + conferenceObj.ConferenceName;

            dbmodel.Conference.find({where: [{ConferenceName: conferenceObj.ConferenceName, CompanyId: companyId, TenantId: tenantId}], include: [{model: dbmodel.ConferenceUser, as:'ConferenceUser'}]})
                .then(function (resConf)
                {
                    client.set(keyConference, JSON.strigify(resConf), function(err, response)
                    {

                    });

                }).catch(function(err)
                {

                });


            dbmodel.Extension.find({where: [{CompanyId: companyId, TenantId: tenantId}], include: [{model: dbmodel.Conference, as:'Conference', where:[{ConferenceName: conferenceObj.ConferenceName}]}]})
                .then(function (resExt)
                {
                    if(resExt && resExt.Extension && resExt.Conference)
                    {
                        var keyExt = 'EXTENSION:' + tenantId + ':' + companyId + ':' + resExt.Extension;

                        client.set(keyExt, JSON.strigify(resExt), function(err, response)
                        {

                        });


                    }


                }).catch(function(err)
                {

                });
        }


    }
    catch(ex)
    {

    }

};


var addPABXUserToCache = function(pabxUserUuid, companyId, tenantId)
{
    try
    {
        if(pabxUserUuid)
        {
            var keyPbxUser = 'PBXUSER:' + tenantId + ':' + companyId + ':' + pabxUserUuid;

            dbModel.PBXUser.find({where :[{CompanyId: companyId},{TenantId: tenantId},{UserUuid: pabxUserUuid}], include : [{model: dbModel.PBXUserTemplate, as: "PBXUserTemplateActive"}, {model: dbModel.FollowMe, as: "FollowMe", include: [{model: dbModel.PBXUser, as: "DestinationUser"}]}, {model: dbModel.Forwarding, as: "Forwarding"}]})
                .then(function (usrObj)
                {
                    if(usrObj)
                    {
                        client.set(keyPbxUser, JSON.strigify(usrObj), function(err, response)
                        {

                        });
                    }


                }).catch(function(err)
                {

                });
        }


    }
    catch(ex)
    {

    }

};

var addFeatureCodeToCache = function(fcObj, companyId, tenantId)
{
    try
    {
        var key = 'FEATURECODE:' + tenantId + ':' + companyId;

        client.set(key, JSON.strigify(fcObj), function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var removeFeatureCodeFromCache = function(companyId, tenantId)
{
    try
    {
        var key = 'FEATURECODE:' + tenantId + ':' + companyId;

        client.del(key, function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var addPBXCompDataToCache = function(compObj, companyId, tenantId)
{
    try
    {
        var key = 'PBXCOMPANYINFO:' + tenantId + ':' + companyId;

        client.set(key, JSON.strigify(compObj), function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var removePBXCompDataFromCache = function(companyId, tenantId)
{
    try
    {
        var key = 'PBXCOMPANYINFO:' + tenantId + ':' + companyId;

        client.del(key, function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var removeScheduleFromCache = function(scheduleId, companyId, tenantId)
{
    try
    {
        var key = 'SCHEDULE:' + tenantId + ':' + companyId + ':' + scheduleId;

        client.del(key, function(err, response)
        {

        });

    }
    catch(ex)
    {

    }

};

var addScheduleToCache = function(scheduleId, companyId, tenantId)
{
    try
    {
        if(scheduleId)
        {
            var keyPbxUser = 'SCHEDULE:' + tenantId + ':' + companyId + ':' + scheduleId;

            dbModel.Schedule.find({where :[{CompanyId: companyId},{TenantId: tenantId},{id: scheduleId}], include : [{model: dbModel.Appointment, as: "Appointment"}]})
                .then(function (schedule)
                {
                    if(schedule)
                    {
                        client.set(keyPbxUser, JSON.strigify(schedule), function(err, response)
                        {

                        });
                    }


                }).catch(function(err)
                {

                });
        }


    }
    catch(ex)
    {

    }

};


module.exports.addContextToCache = addContextToCache;
module.exports.removeContextFromCache = removeContextFromCache;
module.exports.addCallServerToCompanyObj = addCallServerToCompanyObj;
module.exports.addSipProfileToCompanyObj = addSipProfileToCompanyObj;
module.exports.addClusterToCache = addClusterToCache;
module.exports.removeSipProfileFromCompanyObj = removeSipProfileFromCompanyObj;
module.exports.addCallServerByIdToCache = addCallServerByIdToCache;
module.exports.addTrunkNumberByIdToCache = addTrunkNumberByIdToCache;
module.exports.removeTrunkNumberByIdFromCache = removeTrunkNumberByIdFromCache;
module.exports.addTrunkNumberToCache = addTrunkNumberToCache;
module.exports.removeTrunkNumberFromCache = removeTrunkNumberFromCache;
module.exports.addTrunkToCache = addTrunkToCache;
module.exports.addExtensionToCache = addExtensionToCache;
module.exports.addSipUserToCache = addSipUserToCache;
module.exports.addGroupToCache = addGroupToCache;
module.exports.addConferenceToCache = addConferenceToCache;
module.exports.removeGroupFromCache = removeGroupFromCache;
module.exports.removeExtensionFromCache = removeExtensionFromCache;
module.exports.addCloudEndUserToCompanyObj = addCloudEndUserToCompanyObj;
module.exports.removeCloudEndUserFromCompanyObj = removeCloudEndUserFromCompanyObj;
module.exports.addDidNumberToCache = addDidNumberToCache;
module.exports.removeDidNumberFromCache = removeDidNumberFromCache;
module.exports.addTransferCodeToCompanyObj = addTransferCodeToCompanyObj;
module.exports.removeTransferCodeFromCompanyObj = removeTransferCodeFromCompanyObj;
module.exports.addNumberBLToCache = addNumberBLToCache;
module.exports.removeNumberBLFromCache = removeNumberBLFromCache;
module.exports.addCallRuleToCompanyObj = addCallRuleToCompanyObj;
module.exports.removeCallRuleFromCompanyObj = removeCallRuleFromCompanyObj;
module.exports.addApplicationToCompanyObj = addApplicationToCompanyObj;
module.exports.removeApplicationFromCompanyObj = removeApplicationFromCompanyObj;
module.exports.addTranslationToCompanyObj = addTranslationToCompanyObj;
module.exports.removeTranslationFromCompanyObj = removeTranslationFromCompanyObj;
module.exports.addLimitToCache = addLimitToCache;
module.exports.removeLimitFromCache = removeLimitFromCache;
module.exports.removePBXUserFromCache = removePBXUserFromCache;
module.exports.addPABXUserToCache = addPABXUserToCache;
module.exports.addFeatureCodeToCache = addFeatureCodeToCache;
module.exports.removeFeatureCodeFromCache = removeFeatureCodeFromCache;
module.exports.addPBXCompDataToCache = addPBXCompDataToCache;
module.exports.removePBXCompDataFromCache = removePBXCompDataFromCache;
module.exports.removeScheduleFromCache = removeScheduleFromCache;
module.exports.addScheduleToCache = addScheduleToCache;

