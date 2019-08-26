const STATUSES                  = require("./statuses");


class Response {
    constructor(res) {
        this.__response__ = res;
        this.STATUSES = STATUSES;
        this._response = {
            status: this.STATUSES._200_OK,
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: ""
        };
    }

    get status() {
        return this._response.status;
    }

    set status(newStatus) {
        this._response.status = newStatus;
    }

    get headers() {
        return this._response.headers;
    }

    set body(newBody) {
        this._response.body = newBody;
    }

    send() {
        Object.keys(this._response.headers).forEach(headerName => {
            this.__response__.setHeader(headerName, this._response.headers[headerName]);
        });

        this.__response__.statusCode = this._response.status.code;
        this.__response__.statusMessage = this._response.status.message;

        this.__response__.end((this._response.status.emptyBody || this._response.body === "") ? "" : JSON.stringify(this._response.body));
    }
}


/*** Response interceptors ***/
const interceptorsSet = new Set();

Response.addInterceptor = function (interceptorFunction) {
    interceptorsSet.add(interceptorFunction);
};

Response.getInterceptors = function () {
    return interceptorsSet;
};

module.exports = Response;
