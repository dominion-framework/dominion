module.exports = {
    factories: [],
    controllers: [
        __dirname + '/controller'
    ],
    requestInterceptors: [
        __dirname + '/interceptors/requestAddCORSHeader'
    ],
    responseInterceptors: [],
    bootstrap: []
};
