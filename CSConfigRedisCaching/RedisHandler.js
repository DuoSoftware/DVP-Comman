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

            dbmodel.UserGroup.find({where: [{id: resExt.UserGroup.id, CompanyId: companyId, TenantId: tenantId}], include: [{model: dbmodel.Extension, as:'Extension'},{model: dbmodel.SipUACEndpoint, as:'SipUACEndpoint'}]})
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