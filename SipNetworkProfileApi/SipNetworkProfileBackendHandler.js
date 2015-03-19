var dbModel = require('./DVP-DBModels');
var sequelize = dbModel.SequelizeConn;

var deleteNetworkProfile = function(profileId, callback)
{
    try
    {
        dbModel.SipNetworkProfile.find({where: [{id: profileId}]}).complete(function (err, profRec)
        {
            if (!err && profRec)
            {
                profRec.delete().complete(function (err, result)
                {
                    if(!err)
                    {
                        callback(undefined, true);
                    }
                    else
                    {
                        callback(err, false);
                    }
                });
            }
            else
            {
                callback(undefined, false);
            }

        })
    }
    catch(ex)
    {
        callback(ex, false);
    }
}


var addNetworkProfileToCallServer = function(profileId, callServerId, callback)
{
    try
    {
        dbModel.CallServer.find({where: [{id: callServerId}]}).complete(function (err, csRec)
        {
            if (!err && csRec)
            {
                dbModel.SipNetworkProfile.find({where: [{id: profileId}]}).complete(function (err, profRec)
                {
                    if (!err && profRec)
                    {
                        csRec.addSipNetworkProfile(profRec).complete(function (err, result)
                        {
                            if(!err)
                            {
                                callback(undefined, true);
                            }
                            else
                            {
                                callback(err, true);
                            }

                        })
                    }
                    else
                    {
                        callback(undefined, false);
                    }

                })

            }
            else
            {
                callback(undefined, false);
            }})
    }
    catch(ex)
    {
        callback(ex, false);
    }
}

var addSipNetworkProfile = function(profileInfo, callback)
{
    try {

        var profile = dbModel.SipNetworkProfile.build({
            ProfileName: profileInfo.ProfileName,
            MainIp: profileInfo.MainIp,
            InternalIp: profileInfo.InternalIp,
            InternalRtpIp: profileInfo.InternalRtpIp,
            ExternalIp: profileInfo.ExternalIp,
            ExternalRtpIp: profileInfo.ExternalRtpIp,
            Port: profileInfo.Port,
            ObjClass: profileInfo.ObjClass,
            ObjType: profileInfo.ObjType,
            ObjCategory: profileInfo.ObjCategory,
            CompanyId: profileInfo.CompanyId,
            TenantId: profileInfo.TenantId
        });

        profile
            .save()
            .complete(function (err) {
                try {
                    if (!!err) {
                        callback(err, -1, false);
                    }
                    else {
                        var profId = profile.id;
                        callback(undefined, profId, true);
                    }
                }
                catch (ex) {
                    callback(ex,-1, false);
                }

            })

    }
    catch(ex)
    {
        callback(ex, -1, false);
    }
};

module.exports.deleteNetworkProfile = deleteNetworkProfile;
module.exports.addNetworkProfileToCallServer = addNetworkProfileToCallServer;
module.exports.addSipNetworkProfile = addSipNetworkProfile;
