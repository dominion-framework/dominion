const formatLogMessage          = require("./../formatLogMessage");


module.exports = function requestInterceptorLogging(body) {
    console.log(formatLogMessage("<-", this.request.ip, this.request.handler.method, this.request.path, process.hrtime(this.request.__hrtime__)));
    return body;
};
