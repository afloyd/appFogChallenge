/**
 * @author: Austin Floyd
 * @Date: 6/25/12
 * @Time: 12:11 PM
 */

var moment = require('moment');

module.exports = function () {
    var module = function () {};

    var cs            = console;
    module.origLog    = cs.log;
    module.origWarn   = cs.warn;
    module.origError  = cs.error;

    var printfRegex = /(%[disvj])/g;
    // courtesy of http://www.reddit.com/user/itsnotlupus @
    // http://bit.ly/upcWxw
    var printF = function (theArgs) {
        var firstArg = theArgs[0];
        if (theArgs.length && typeof firstArg === "string" && firstArg.match(printfRegex)) {
            var msg = theArgs[0];
            if (msg) {
                var args = Array.prototype.slice.call(theArgs,1), arg;
                var startIdx = 1;
                var updatedMsg = msg.replace(printfRegex, function(a,val) {
                    startIdx++;
                    arg = args.shift();
                    if (arg !== undefined) {
                        switch(val.charCodeAt(1)){
                            case 100: return +arg; // d
                            case 105: return Math.round(+arg); // i
                            case 115: return String(arg); // s
                            case 118://v
                            case 106://j
                            default: return arg;
                        }
                    }
                    return val;
                });

                return [updatedMsg].concat(Array.prototype.slice.call(theArgs, startIdx));
            }
            else {
                return theArgs;
            }
        }
        else {
            return theArgs;
        }
    }

    console.log = function () {
        var updatedArgs = printF(arguments);
        updatedArgs = [moment().format('MM-DD-YYYY, h:mm:ssa, Z - ')].concat(Array.prototype.slice.call(updatedArgs));
        module.origLog.apply(this, updatedArgs);
    };
    console.warn = function () {
        var updatedArgs = printF(arguments);
        module.origWarn.apply(this, updatedArgs);
    };
    console.warn = function () {
        var updatedArgs = printF(arguments);
        module.origError.apply(this, updatedArgs);
    };

    return module;
};