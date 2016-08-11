var dust = require('dustjs-linkedin');
var juice = require('juice');
var Template = require('../Model/Template').Template;
var uuid = require('node-uuid');
var logger = require('../LogHandler/CommonLogHandler.js').logger;

module.exports.Render = function(name, company, tenat, params, cb){


    Template.findOne({name: name,company: company,tenant: tenat},function (errPickTemplate,resPickTemp) {

        if (!errPickTemplate) {

            if (resPickTemp) {

                var compileId = uuid.v4();

                var compiled = dust.compile(resPickTemp.content.content, compileId);
                dust.loadSource(compiled);
                dust.render(compileId, params, function (errRendered, outRendered) {
                    if (errRendered) {
                        logger.error("Error in rendering " + errRendered);
                    }
                    else {

                        var renderedTemplate = "";
                        var juiceOptions = {
                            applyStyleTags: true
                        }

                        if (resPickTemp.styles.length > 0) {
                            for (var i = 0; i < resPickTemp.styles.length; i++) {
                                if (i == 0) {
                                    renderedTemplate = outRendered;
                                }
                                logger.info("Rendering is success " + resPickTemp.styles[i].content);

                                renderedTemplate = juice.inlineContent(renderedTemplate, resPickTemp.styles[i].content, juiceOptions);
                                if (i == (resPickTemp.styles.length - 1)) {
                                   cb(true,renderedTemplate);
                                }
                            }
                        }
                        else {
                            console.log("Rendering Done");
                            cb(true,outRendered);

                        }
                    }
                });

            } else {

                logger.error("No template found");
                cb(false);

            }

        } else {

            logger.error("Pick template failed ", errPickTemplate);
            cb(false);
        }
    });

}