
class DispatchRequest {

    constructor(req, url) {
        this.message = {
            method: "GET",
            headers: req.headers,
            statusCode: 200,
            statusMessage: "OK",
            body: "",
            url
        };

        this.connection = {
            "encrypted": true,
            "remoteAddress": req.connection.remoteAddress
        };
    }

    get method() {
        return this.message.method;
    }

    get url() {
        return this.message.url;
    }

    get headers() {
        return this.message.headers
    }

    on(event, cb) {
        event === "end" && cb(this.message.body === ""? "" : JSON.stringify(this.message.body));
        return this;
    }
}

module.exports = DispatchRequest;
