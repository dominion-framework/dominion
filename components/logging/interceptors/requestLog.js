const formatLogMessage          = require("./../formatLogMessage");


module.exports = function requestInterceptorLogging() {
    this.request.__hrtime__ = process.hrtime();
    console.log(formatLogMessage("->", this.request.ip, this.request.handler.method, this.request.path));
};
