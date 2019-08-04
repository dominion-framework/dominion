module.exports = {
    server: {
        protocol: "https",
        host: "localhost",
        port: 7000,
        // No slash in the end.
        url: "http://localhost"
    },

    router: {
        // e.g. api/v2/
        urlPrefix: "",
        // e.g. "[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}"
        primaryKeyPattern: "\\d+"
    },

    cors: {
        // e.g. * | ["example.com"] | () => {} (synchronous callback function with Message context returning array of allowed origins)
        origin: "localhost:7000",
        methods: ["OPTIONS", "GET", "POST", "PUT", "DELETE"],
        headers: ["Content-Type", "Set-Cookies", "Authorization"],
        credentials: false,
        maxAge: 5 /* seconds */
    },

    websockets: {
        clientTracking: true,
        perMessageDeflate: false,
        maxPayload: 400 * 1024 * 1024 /* bytes*/
    },

    media: {
        urlPath: "/media",
        saveDir: "../../media"
    }
};
