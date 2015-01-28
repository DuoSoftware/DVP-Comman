var Sequelize = require('sequelize');

var SequelizeConn = new Sequelize('NodeTest', 'duo', 'DuoS123', {
    dialect: "postgres", // or 'sqlite', 'postgres', 'mariadb'
    port:    5432, // or 5432 (for postgres)
    host:"192.168.2.98" //host address
});

var SipExt = SequelizeConn.define('CSDB_SipExtension', {
    RecordGuid: Sequelize.STRING,
    ExtensionName: Sequelize.STRING,
    SipPassword: Sequelize.STRING,
    Domain: Sequelize.STRING,
    Context: Sequelize.STRING,
    Enabled: Sequelize.BOOLEAN,
    Email: Sequelize.STRING,
    ExtraData: Sequelize.STRING,
    CompanyId: Sequelize.INTEGER,
    TenantId: Sequelize.INTEGER,
    ObjClass: Sequelize.STRING,
    ObjType: Sequelize.STRING,
    ObjCategory: Sequelize.STRING,
    AddUser: Sequelize.STRING,
    UpdateUser: Sequelize.STRING,
    AddTime: Sequelize.DATE,
    UpdateTime: Sequelize.DATE
});


var Cloud = SequelizeConn.define('CSDB_Cluster', {

    Name: Sequelize.STRING,
    //ID: Sequelize.INTEGER,
    Activate: Sequelize.BOOLEAN,
    ID: Sequelize.INTEGER,
    Code: Sequelize.INTEGER,
    CompanyId: Sequelize.INTEGER,
    TenantId: Sequelize.INTEGER,
    CloudModel: Sequelize.INTEGER,
    Class: Sequelize.STRING,
    Type: Sequelize.STRING,
    Category: Sequelize.STRING,
    IsLoadBalanced: Sequelize.BOOLEAN,
    LoadBalancerID: Sequelize.INTEGER
});


var Network = SequelizeConn.define('CSDB_Network', {
    Type: Sequelize.STRING,
    Owner: Sequelize.INTEGER,
    Network: Sequelize.STRING,
    Mask: Sequelize.INTEGER,
    CloudID: Sequelize.INTEGER,
    NetWorkID: Sequelize.INTEGER
});


var LoadBalancer = SequelizeConn.define('CSDB_LoadBalancer', {
    Type: Sequelize.STRING,
    MainIP: Sequelize.STRING,
    ID: Sequelize.INTEGER
});

var CloudEndUser = SequelizeConn.define('CSDB_CloudEndPoint', {

    CompanyId: Sequelize.INTEGER,
    TenantId: Sequelize.INTEGER,
    SIPConnectivityProvision: Sequelize.INTEGER,
    CloudID: Sequelize.INTEGER,
    NetWorkID: Sequelize.INTEGER
});


var Context = SequelizeConn.define('CSDB_Context', {
    Context: Sequelize.STRING,
    Description: Sequelize.STRING,
    CompanyId: Sequelize.INTEGER,
    TenantId: Sequelize.INTEGER,
    ObjClass: Sequelize.STRING,
    ObjType: Sequelize.STRING,
    ObjCategory: Sequelize.STRING,
    AddUser: Sequelize.STRING,
    UpdateUser: Sequelize.STRING,
    AddTime: Sequelize.DATE,
    UpdateTime: Sequelize.DATE
});



function CreateDB(){

    SequelizeConn
        .sync({ force: true })
        .complete(function(err) {
            if (!!err) {
                console.log('An error occurred while creating the table:', err)
            } else {
                console.log('It worked!')
            }
        })
}


module.exports.SequelizeConn = SequelizeConn;
module.exports.SipExt = SipExt;
module.exports.Context = Context;
module.exports.Cloud= Cloud;
module.exports.Network= Network;
module.exports.LoadBalancer= LoadBalancer;
module.exports.CloudEndUser= CloudEndUser;
module.exports.CreateDB= CreateDB;





