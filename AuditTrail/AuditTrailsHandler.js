/**
 * Created by Rajinda on 9/29/2015.
 */

var logger = require('../LogHandler/CommonLogHandler').logger;
var DbConn = require('dvp-dbmodels');
var moment = require('moment');
var Sequelize = require('sequelize');
var request = require('request');


module.exports.CreateAuditTrails = function (tenantId,companyId,iss,auditTrails, callBack) {


    DbConn.AuditTrails
        .create(
            {
                KeyProperty: auditTrails.KeyProperty,
                OldValue: auditTrails.OldValue,
                NewValue: auditTrails.NewValue,
                Description: auditTrails.Description,
                Author: auditTrails.Author,
                User: iss,
                OtherData: auditTrails.OtherData,
                ObjectType: auditTrails.ObjectType,
                Action: auditTrails.Action,
                Application: auditTrails.Application,
                TenantId: tenantId,
                CompanyId: companyId
            }
        ).then(function (cmp) {
            callBack(undefined,cmp);
    }).catch(function (err) {
            callBack(err,undefined);
    });

};

module.exports.GetAllAuditTrails = function (tenantId,companyId, callBack) {
    DbConn.AuditTrails.findAll({
        where: [{CompanyId: companyId}, {TenantId: tenantId}],order: [['AuditTrailsId', 'DESC']]
    }).then(function (CamObject) {
        callBack(undefined,CamObject);
    }).catch(function (err) {
        callBack(err,undefined);
    });
};

module.exports.GetAllAuditTrailsPaging =function(tenantId,companyId,pageSize,pageNo, callBack) {

    DbConn.AuditTrails.findAll({
        where: [{TenantId: tenantId}, {CompanyId: companyId}], offset: ((pageNo - 1) * pageSize),
        limit: pageSize,order: [['AuditTrailsId', 'DESC']]
    }).then(function (CamObject) {
        callBack(undefined,CamObject);
    }).catch(function (err) {
        callBack(err,undefined);
    });
};
