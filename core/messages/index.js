const Request                   = require("./request");
const Response                  = require("./response");


class Message {
    constructor (req, res) {
        this.request = new this.constructor.request(req);
        this.response = new this.constructor.response(res);
    }
}

Message.request = Request;
Message.response = Response;

Message.request.addInterceptor(require("./interceptors/requestBody"));
Message.request.addInterceptor(require("./interceptors/requestCookie"));

module.exports = Message;
