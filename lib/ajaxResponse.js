/**
 * User: AustinFloyd
 * Date: 11/12/12
 * Time: 1:19 PM
 */

var errorReasons = require('./error-reasons'),
	ERROR_CODE_PROPERTY_NAME = 'code',
	inspect = require('util').inspect;

/**
 * Takes response data and generates a standardized JSON response passed to res.json()
 * @param data	{*}			The data to pass back client-side
 * @param res	{Object}	The response object
 */
function successHelper (data, res) {
	res.json({
		success: true,
		data: data
	});
};

/**
 * Takes either an error or service response and generates a standardized JSON response passed to next()
 * @param err	{*}			Either the error, or the service error reason (can be a String, or array of Strings)
 * @param next	{Object}	The next callback
 */
function errorHelper (err, next) {
	var response = {
		success: false
	};

	if (err instanceof Array) {
		err = err.filter(function (reason) {
			return checkReasonValidity(reason);
		}).map(function (reason) {
			return reason.message;
	   	});
		response.reason = err;
	}
	//Make sure that 'err' is not an actual error and is just a single 'error reason'
	else if (!(err instanceof Error) && typeof err === 'object' && err.hasOwnProperty(ERROR_CODE_PROPERTY_NAME)) {
		checkReasonValidity(err);
		response.reason = [err.message];
	}
	else {
		response.error = err;
	}


	next(response);
};

/**
 * Determines if the reason has been properly defined, throws an error if not
 * @param reason	{String}	The reason code
 */
function checkReasonValidity(reason) {
	//TODO: Disable reason validity checking in PROD, or just log error if in PROD?
	if (!reason.hasOwnProperty(ERROR_CODE_PROPERTY_NAME) || !errorReasons[reason.code]) {
		throw new Error('Invalid reason code! ' + inspect(reason, false, null));
	}
	return true;
}

module.exports = {
	/**
	 * Takes either an error or service response and generates a standard JSON response passed to next()
	 * @param err	{*}			Either the error, or the service error reason (can be a String, or array of Strings)
	 * @param next	{Object}	The next callback
	 */
	error: errorHelper,
	/**
	 * Takes response data and generates a standardized JSON response passed to res.json()
	 * @param data	{*}			The data to pass back client-side
	 * @param res	{Object}	The response object
	 */
	success: successHelper
};