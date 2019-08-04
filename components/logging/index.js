module.exports = {
    factories: [],
    controllers: [],
    requestInterceptors: [
        __dirname + '/interceptors/requestLog'
    ],
    responseInterceptors: [
        __dirname + '/interceptors/responseLog'
    ],
    bootstrap: []
};
