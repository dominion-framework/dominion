const Config                    = require('./../../config');


const FN_ARGS = /^[^\(]*\([\{\s]*([^\)\}]*)[\}\s]*\)/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /^\s*(\S+?)([iI]d)?\s*(=\s*.+)?$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ID_PATTERN_END = '/(' + Config.router.primaryKeyPattern + ')';
const ID_PATTERN = '/(' + Config.router.primaryKeyPattern + ')/';
const FN_GET_ANNOTATION = /\/\/\s+@(\w+):?\s(.*)/g;
const ID_OPTIONAL_START = '(?=.*';
const ID_OPTIONAL_END = '=([^&\\s]+)|.*)';

const CAMEL_TO_KEBAB = string => string.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const makeRoute = function(method, handler, rootPath = '', factory, permission = null){
    const parsedFunction = reflection(handler);

    return {
        method,
        handler,
        factory,
        arguments: parsedFunction.arguments,
        annotations: parsedFunction.annotations,
        permission: parsedFunction.annotations.permission ?
            parsedFunction.annotations.permission
            : permission? permission.toLowerCase() : null,
        pattern: parsedFunction.annotations.path ?
            getPatternForArgs({required: [],optional: parsedFunction.arguments.optional}, parsedFunction.annotations.path)
            : getPatternForArgs(parsedFunction.arguments, rootPath)
    }
};

const reflection = function(fn){
    const fnString = Function.prototype.toString.call(fn);
    const fnTextArguments = fnString.replace(STRIP_COMMENTS, '');
    const fnDescription = {
        annotations: {},
        arguments : {
            required: [],
            optional: []
        }};

    fnString.replace(FN_GET_ANNOTATION, function (a, key, parameter) {
        fnDescription.annotations[key] = parameter;
    });

    fnTextArguments.match(FN_ARGS)[1].split(FN_ARG_SPLIT).forEach(arg => {
        arg.replace(FN_ARG, (all, name, id, optional) => {
            fnDescription.arguments[optional ? 'optional' : 'required'].push({
                name: name + (optional && id || ''),
                varName: name + (id || '')
            });
        });
    });

    return fnDescription;
};

const getPatternForArgs = function (args, rootPath) {
    let urlPrefix = (Config.router && Config.router.urlPrefix) || '';
    let stringRegexp = getStringRegexp(args, rootPath);

    return new RegExp(`^${urlPrefix + stringRegexp}$`);
};

const getStringRegexp = function (args, rootPath) {

    let stringRegexp;
    let stringRegexpOptional_1;
    let stringRegexpOptional_2;

    if (args.required.length === 0) {
        stringRegexp = rootPath;
    } else {
        stringRegexp = args.required.reduce(function (previousValue, currentItem, index) {
            if (currentItem.name.toLowerCase() === rootPath.replace(/\W/g,'').toLowerCase()) {
                return previousValue + rootPath + ID_PATTERN_END + (args.required.length - 1 !== index? "/" : "");
            } else {
                if (args.required.length - 1 === index) {
                    return previousValue + currentItem.name + ID_PATTERN + rootPath;
                } else {
                    return previousValue + currentItem.name + ID_PATTERN;
                }
            }
        }, "");
    }

    stringRegexp = CAMEL_TO_KEBAB(stringRegexp);

    if (args.optional.length > 0) {
        stringRegexpOptional_1 = args.optional.reduce(function (previousValue, currentItem) {
            return previousValue + ID_OPTIONAL_START + currentItem.name + ID_OPTIONAL_END;
        }, "(?:\\?");

        stringRegexpOptional_2 = args.optional.reduce(function (previousValue, currentItem, index) {
            if (args.optional.length - 1 !== index) {
                return previousValue + currentItem.name + "|";
            } else {
                return previousValue + currentItem.name;
            }
        }, "(?:&?(?:");

        stringRegexp += stringRegexpOptional_1 + stringRegexpOptional_2 + ")=[^&\\s]+)*)?";
    }

    return stringRegexp;
};


module.exports = makeRoute;
