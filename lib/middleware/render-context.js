/**
 * User: AustinFloyd
 * Date: 11/5/12
 * Time: 2:11 PM
 */

module.exports = function (opts) {
	return function renderContext(req, res, next) {
		var _render = res.render;
		res.render = function (view, options, callback) {
			options.req = req;

			options.views = req.contest.views;

			_render.call(res, view, options, callback);
		};
		next();
	}
};