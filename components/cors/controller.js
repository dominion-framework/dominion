const Config                    = require("./../../config");


const CORSController = {

    path: 'cors',

    permissions: {},

    OPTIONS: [

        function () {
            // @path: .*
            // @summary: Handle CORS OPTIONS request

            this.response.headers['Access-Control-Allow-Methods'] = Config.cors.methods.toString();
            this.response.headers['Access-Control-Allow-Headers'] = Config.cors.headers.toString();
            this.response.headers['Access-Control-Allow-Credentials'] = Config.cors.credentials.toString();
            this.response.headers['Access-Control-Allow-Max-Age'] = Config.cors.maxAge.toString();
        }

    ]

};

module.exports = CORSController;
