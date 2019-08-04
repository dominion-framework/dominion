const Statuses                  = require("./statuses");


class Response {
    constructor(res) {
        this._serverResponse = res;
        this.statuses = Statuses;
        this._response = {
            status: this.statuses._200_OK,
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
            this._serverResponse.setHeader(headerName, this._response.headers[headerName]);
        });

        this._serverResponse.statusCode = this._response.status.code;
        this._serverResponse.statusMessage = this._response.status.message;

        this._serverResponse.end((this._response.status.emptyBody || this._response.body === "") ? "" : JSON.stringify(this._response.body));
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
