var prof = require('./SipNetworkProfileBackendHandler.js');

var profileInf = {
    ProfileName: "TestProfile",
    MainIp: "192.168.1.1",
    InternalIp: "192.168.1.1",
    InternalRtpIp: "192.168.1.1",
    ExternalIp: "192.168.1.1",
    ExternalRtpIp: "192.168.1.1",
    Port: 1234,
    ObjClass: "ff",
    ObjType: "ddd",
    ObjCategory: "internal",
    CompanyId: 1,
    TenantId: 3
}

var dd = 0;

var addProfile = prof.addSipNetworkProfile(profileInf, function(err, id, tt)
{
    if(err)
    {

    }
    else
    {
        dd = id;
    }
})

var setProfile = prof.addNetworkProfileToCallServer(dd, 1, function(err, tt)
{
    if(err)
    {

    }
})

var deleteProf = prof.deleteNetworkProfile(dd, function(err, tt){
    if(err)
    {

    }
})