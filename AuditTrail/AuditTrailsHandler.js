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
var util = require('util');


module.exports.CreateAuditTrails = function (tenantId,companyId,iss,auditTrails, callBack) {


    var differences;

    var tempNewObj = auditTrails.NewValue;
    var tempOldObj = auditTrails.OldValue;

    if(tempNewObj && util.isObject(tempNewObj) ){

        tempNewObj = JSON.stringify(auditTrails.NewValue);
    }

    if(tempOldObj && util.isObject(tempOldObj) ){

        tempOldObj = JSON.stringify(auditTrails.OldValue);
    }


    if(util.isObject(tempNewObj) && util.isObject(tempOldObj) )
    {

        differences = diff(auditTrails.OldValue, auditTrails.NewValue);
    }


    DbConn.AuditTrails
        .create(
            {
                KeyProperty: auditTrails.KeyProperty,
                OldValue: tempOldObj,
                NewValue: tempNewObj,
                Description: auditTrails.Description,
                Author: auditTrails.Author,
                User: iss,
                OtherJsonData: JSON.stringify(differences),
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
        var CamObj = CamObject.map(function (item) {

            if(item.dataValues.OtherJsonData)
            {
                var oData=item.dataValues.OtherJsonData;
                item.dataValues.OtherJsonData=JSON.parse(oData);
            }
            return item;

        });

        callBack(undefined,CamObj);
    }).catch(function (err) {
        callBack(err,undefined);
    });
};

module.exports.GetAllAuditTrailsPaging =function(tenantId,companyId, application, property, author, starttime, endtime, pageSize, pageNo, callBack) {


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

        query.KeyProperty = property;
    }

    if(author){

        query.Author = author;
    }

    DbConn.AuditTrails.findAll({
        where: query, offset: ((pageNo - 1) * pageSize),
        limit: pageSize,order: [['AuditTrailsId', 'DESC']]
    }).then(function (CamObject) {
        if(CamObject.OtherJsonData)
        {
            var oData=CamObject.OtherJsonData;
            CamObject.OtherJsonData=JSON.parse(oData);
        }
        callBack(undefined,CamObject);
    }).catch(function (err) {
        callBack(err,undefined);
    });
};

module.exports.GetAllAuditTrailsCount =function(tenantId,companyId, application, property, author, starttime, endtime, callBack) {


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

        query.KeyProperty = property;
    }

    if(author){

        query.Author = author;
    }

    //dbModel.CallCDRProcessed.aggregate('*', 'count', {where :[{CreatedTime : { gte: st , lt: et}, CompanyId: companyId, TenantId: tenantId, DVPCallDirection: 'inbound', QueueSec: {lte: abandonCallThreshold}, AgentAnswered: false, ObjType: 'HTTAPI'}]}).then(function(dropCount)

    DbConn.AuditTrails.aggregate('*', 'count',{where: query
    }).then(function (count) {
        callBack(null, count);
    }).catch(function (err) {
        callBack(err, 0);
    });
};
