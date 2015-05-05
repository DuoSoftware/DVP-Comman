var winston = require('winston');
require('winston-logstash-udp');

/*
winston.add(winston.transports.File, { filename: 'D:/somefile.log' });

var WriteLog = funnpm install ction(message)
{
    winston.log('info', 'Hello distributed log files!');
    winston.info('Hello again distributed logs');
};

module.exports.WriteLog = WriteLog;
*/


 var logger = new winston.Logger();

 if (process.env.DEPLOYMENT_ENV == 'docker') {

     logger.add(winston.transports.Console, {colorize: true});
     //logger.add(winston.transports.File, { filename: 'logger.log' });

 }
 else {

     logger.add(winston.transports.Console, {colorize: true});

     if(process.env.LOG_PATH) {
         logger.add(winston.transports.File, {filename: process.env.LOG_PATH + '/logger.log'});
     }else{
         logger.add(winston.transports.File, {filename: 'logger.log'});

     }
 }



if(process.env.LOG_SERVER && process.env.LOG_PORT){


    winston.add(winston.transports.LogstashUDP, {
        port: process.env.LOG_PORT,
        appName: process.env.HOST_NAME,
        host: LOG_SERVER
    });

}



module.exports.logger = logger;
