var winston = require('winston'),
    LogstashUDP = require('winston-logstash-udp').LogstashUDP;


var level = 'debug';

if (process.env.LOG_LEVEL) {
    level = process.env.LOG_LEVEL;
}


const transports = [
    new winston.transports.Console({
        level: level,
        colorize: true
    })
];


if (process.env.DEPLOYMENT_ENV != 'docker') {
    if (process.env.LOG_PATH) {
        transports.push(new (winston.transports.File)({
                filename: process.env.LOG_PATH + '/logger.log', level: level, maxsize: 5242880, maxFiles: 10
            }
        ));
    } else {
        transports.push(new (winston.transports.File)({
            filename: 'logger.log',
            level: level,
            maxsize: 5242880,
            maxFiles: 10
        }));
    }
}

if (process.env.SYS_LOG_HOST && process.env.SYS_LOG_PORT) {
    transports.push(new (LogstashUDP)({
        port: process.env.SYS_LOG_PORT,
        appName: process.env.HOST_NAME,
        host: process.env.SYS_LOG_HOST,
        level: level
    }));
}

var logger = new (winston.Logger)({
    transports: transports
});

module.exports.logger = logger;
