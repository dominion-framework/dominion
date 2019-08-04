const Config                    = require("./../../../config");
const Errors                    = require("./../../../core/errors");


function requestInterceptorAddCORSHeader() {
    let allowedOrigins;

    if (this.request.headers.origin === undefined) {
        return;
    }

    if (Config.cors.origin === "*") {
        this.response.headers["Access-Control-Allow-Origin"] = "*";
    } else {
        this.response.headers["Vary"] = (this.response.headers["Vary"] ? this.response.headers["Vary"] + ", " : "") + "Origin";

        allowedOrigins = Array.isArray(Config.cors.origin) ? Config.cors.origin : Config.cors.origin.call(this);
        if (allowedOrigins.indexOf(this.request.headers.origin) === -1) {
            throw new Errors.Forbidden(`Origin "${this.request.headers.origin}" is not allowed`);
        }
        this.response.headers["Access-Control-Allow-Origin"] = this.request.headers.origin;
    }

}

module.exports = requestInterceptorAddCORSHeader;
