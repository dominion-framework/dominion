
class DispatchResponse {

    constructor(){
        this.message = {
            headers: [],
            statusCode: 200,
            statusMessage: "OK",
            body: ""
        };
    }

    setHeader(name, value) {
        this.message.headers.push({name: value});
    }

    set statusCode(code) {
        this.message.statusCode = code;
    }

    set statusMessage(message) {
        this.message.statusMessage = message;
    }

    end() { }
}

module.exports = DispatchResponse;