/**
 * User: AustinFloyd
 * Date: 1/26/13
 * Time: 4:18 PM
 */

module.exports = function (opts) {
	return function requestContextInit(req, res, next) {
		req.contest = {};
		next();
	};
};