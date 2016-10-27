/**
 * Created by Rajinda on 9/29/2015.
 */

var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var DbConn = require('dvp-dbmodels');
var moment = require('moment');
var Sequelize = require('sequelize');
var request = require('request');


module.exports.CreateAuditTrails = function (req, res) {

    var tenantId = req.user.tenant;
    var companyId = req.user.company;
    var user = req.user.iss;
    DbConn.AuditTrails
        .create(
            {
                KeyProperty: req.body.KeyProperty,
                OldValue: req.body.OldValue,
                NewValue: req.body.NewValue,
                Description: req.body.Description,
                Author: req.body.Author,
                User: user,
                OtherData: req.body.OtherData,
                ObjectType: req.body.ObjectType,
                Action: req.body.Action,
                Application: req.body.Application,
                TenantId: tenantId,
                CompanyId: companyId
            }
        ).then(function (cmp) {
        var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, cmp);
        logger.info('CreateAuditTrails - [PGSQL] - inserted successfully. [%s] ', jsonString);
        res.end(jsonString);
    }).catch(function (err) {
        logger.error('CreateAuditTrails - [%s] - [PGSQL] - insertion  failed-[%s]', user, err);
        var jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
        res.end(jsonString);
    });

};

module.exports.GetAllAuditTrails = function (req, res) {
    var tenantId = req.user.tenant;
    var companyId = req.user.company;
    DbConn.AuditTrails.findAll({
        where: [{CompanyId: companyId}, {TenantId: tenantId}],order: [['AuditTrailsId', 'DESC']]
    }).then(function (CamObject) {
        if (CamObject) {
            logger.info('GetAllAuditTrails - [%s] - [PGSQL]  - Data found  - %s-[%s]', tenantId, companyId, JSON.stringify(CamObject));
            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, CamObject);

            res.end(jsonString);
        }
        else {
            logger.error('GetAllAuditTrails - [PGSQL]  - No record found for %s - %s  ', tenantId, companyId);
            var jsonString = messageFormatter.FormatMessage(new Error('No record'), "EXCEPTION", false, undefined);
            res.end(jsonString);
        }
    }).catch(function (err) {
        logger.error('GetAllAuditTrails - [%s] - [%s] - [PGSQL]  - Error in searching.-[%s]', tenantId, companyId, err);
        var jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
        res.end(jsonString);
    });
};

module.exports.GetAllAuditTrailsPaging =function(req, res) {

    var rowCount = req.params.pageSize;
    var pageNo = req.params.PageNo;
    var tenantId = req.user.tenant;
    var companyId = req.user.company;
    DbConn.AuditTrails.findAll({
        where: [{TenantId: tenantId}, {CompanyId: companyId}], offset: ((pageNo - 1) * rowCount),
        limit: rowCount,order: [['AuditTrailsId', 'DESC']]
    }).then(function (CamObject) {
        if (CamObject) {
            logger.info('GetAllAuditTrailsPaging - [%s] - [PGSQL]  - Data found  - %s-[%s]', tenantId, companyId, JSON.stringify(CamObject));
            var jsonString = messageFormatter.FormatMessage(undefined, "SUCCESS", true, CamObject);

            res.end(jsonString);
        }
        else {
            logger.error('GetAllAuditTrailsPaging - [PGSQL]  - No record found for %s - %s  ', tenantId, companyId);
            var jsonString = messageFormatter.FormatMessage(new Error('No record'), "EXCEPTION", false, undefined);
            res.end(jsonString);
        }
    }).catch(function (err) {
        logger.error('GetAllAuditTrailsPaging - [%s] - [%s] - [PGSQL]  - Error in searching.-[%s]', tenantId, companyId, err);
        var jsonString = messageFormatter.FormatMessage(err, "EXCEPTION", false, undefined);
        res.end(jsonString);
    });
};
