module.exports = function formatLogMessage(prefix, ip, method, path, duration) {
    return [
        "[" + new Date().toISOString() + "]",
        ip.padEnd(15),
        prefix,
        (duration? (duration[0]*1e3 + duration[1]/1e6).toFixed(2) + "ms" : "").padStart(9),
        method.padEnd(8),
        path
    ].join(" ");
};
