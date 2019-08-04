const querystring                   = require("querystring");


module.exports = function requestInterceptorAddCookies() {
    return new Promise(resolve => {
        if (this.request.headers["cookie"]){
            this.request.cookies = querystring.parse(this.request.headers["cookie"]);
        }
        resolve();
    });
};
