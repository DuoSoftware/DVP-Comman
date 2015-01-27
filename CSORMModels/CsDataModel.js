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
    ExtType: Sequelize.STRING,
    ExtraData: Sequelize.STRING,
    CompanyId: Sequelize.INTEGER,
    TenantId: Sequelize.INTEGER,
    ExtClass: Sequelize.STRING,
    ExtType: Sequelize.STRING,
    ExtCategory: Sequelize.STRING,
    AddUser: Sequelize.STRING,
    UpdateUser: Sequelize.STRING,
    AddTime: Sequelize.DATE,
    UpdateTime: Sequelize.DATE
});

var Context = SequelizeConn.define('CSDB_Context', {
    Context: Sequelize.STRING,
    Description: Sequelize.STRING,
    ContextCat: Sequelize.STRING,
    CompanyId: Sequelize.INTEGER,
    TenantId: Sequelize.INTEGER,
    ContextClass: Sequelize.STRING,
    ContextType: Sequelize.STRING,
    ContextCategory: Sequelize.STRING,
    AddUser: Sequelize.STRING,
    UpdateUser: Sequelize.STRING,
    AddTime: Sequelize.DATE,
    UpdateTime: Sequelize.DATE
});


module.exports.SequelizeConn = SequelizeConn;
module.exports.SipExt = SipExt;
module.exports.Context = Context;


