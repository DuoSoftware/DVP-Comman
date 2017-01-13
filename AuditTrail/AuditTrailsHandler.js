/**
 * Created by Rajinda on 9/29/2015.
 */

var logger = require('../LogHandler/CommonLogHandler').logger;
var DbConn = require('dvp-dbmodels');
var moment = require('moment');
var Sequelize = require('sequelize');
var request = require('request');
var diff = require('deep-diff').diff;
var isJSON = require('is-json');


module.exports.CreateAuditTrails = function (tenantId,companyId,iss,auditTrails, callBack) {


    var differences;
    if(auditTrails.OldValue && auditTrails.NewValue && isJSON(auditTrails.OldValue) && isJSON(auditTrails.NewValue)){

        var differences = diff(auditTrails.OldValue, auditTrails.NewValue);
    }

    DbConn.AuditTrails
        .create(
            {
                KeyProperty: auditTrails.KeyProperty,
                OldValue: auditTrails.OldValue,
                NewValue: auditTrails.NewValue,
                Description: auditTrails.Description,
                Author: auditTrails.Author,
                User: iss,
                OtherJsonData: differences,
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

module.exports.GetAllAuditTrailsPaging =function(tenantId,companyId, application, property, starttime, endtime, pageSize, pageNo, callBack) {


    var query  = {
        TenantId: tenantId,
        CompanyId: companyId
    };

    if(starttime &&  endtime){

        query.createdAt =  {
            $lte: new Date(endtime),
            $gte: new Date(starttime)
        }
    }

    if(application){

        query.Application = application;
    }

    if(property){

        uery.KeyProperty = property;
    }

    DbConn.AuditTrails.findAll({
        where: query, offset: ((pageNo - 1) * pageSize),
        limit: pageSize,order: [['AuditTrailsId', 'DESC']]
    }).then(function (CamObject) {
        callBack(undefined,CamObject);
    }).catch(function (err) {
        callBack(err,undefined);
    });
};
