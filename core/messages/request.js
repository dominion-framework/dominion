const url                       = require("url");


class Request {
    constructor(req) {
        this.__request__ = req;
        this.cookies = {};
        this.session = null;
        this.body = {};
    }

    get method() {
        return this.__request__.method.toUpperCase();
    }

    get protocol() {
        return this.__request__.connection.encrypted ? "https" : "http";
    }

    get host() {
        return this.__request__.headers.host.toLowerCase();
    }

    get path() {
        const requestUrl = url.parse(this.__request__.url);
        return `${requestUrl.pathname.replace(/^\/|\/$/g, "").toLowerCase()}${requestUrl.search || ""}`;
    }

    get url() {
        return `${this.protocol}://${this.host}/${this.path}`;
    }

    get headers() {
        return this.__request__.headers;
    }

    get ip() {
        return this.__request__.headers["x-forwarded-for"]
            || this.__request__.connection.remoteAddress
            || this.__request__.socket.remoteAddress
            || this.__request__.connection.socket.remoteAddress;
    }
}


/*** Request interceptors ***/
const interceptorsSet = new Set();

Request.addInterceptor = function (interceptorFunction) {
    interceptorsSet.add(interceptorFunction);
};

Request.getInterceptors = function () {
    return interceptorsSet;
};

module.exports = Request;
