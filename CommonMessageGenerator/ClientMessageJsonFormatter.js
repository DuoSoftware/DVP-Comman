var stringify = require('stringify');

var FormatMessage = function(exception, customMessage, isSuccess, resultObj)
{
    var result = {
        Exception : exception,
        CustomMessage : customMessage,
        IsSuccess : isSuccess,
        Result : resultObj
    };

    return JSON.stringify(result);
};

module.exports.FormatMessage = FormatMessage;