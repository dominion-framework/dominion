const Errors                    = require("./../../errors");


const JSON_CONTENT_TYPE = "application/json";

module.exports = function requestInterceptorBodyParser() {
    return new Promise((resolve, reject) => {
        let body = [];

        this.request.__request__
            .on("error", error => {
                reject(new Errors.Fatal(error));
            })
            .on("data", chunk => {
                body.push(chunk);
            })
            .on("end", data => {
                body = data || Buffer.concat(body).toString();

                if (body === "") {
                    return resolve();
                }

                switch (this.request.headers["content-type"]) {
                    case JSON_CONTENT_TYPE:
                        try {
                            resolve(JSONBodyParser(body, this.request));
                        } catch (error) {
                            reject(error);
                        }
                        break;
                    default:
                        reject(new Errors.Fatal("Incorrect Content-Type of the request. Expected 'application/json'."));
                }

            });
    });
};

function JSONBodyParser(body, messageRequest) {
    try {
        body && (messageRequest.body = JSON.parse(body));
    } catch (error) {
        throw new Errors.BadRequest("Invalid JSON in request body.");
    }
}
