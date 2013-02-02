/**
 * User: AustinFloyd
 * Date: 1/26/13
 * Time: 4:19 PM
 */

var publicStaticDirs = ['img', 'js', 'stylesheets', 'third-party'];

module.exports = function (opts) {
	return function (req, res, next) {
		if (publicStaticDirs.indexOf(req.originalUrl.split('/')[1]) !== -1) {
			return next();
		}
		console.log(req.originalUrl, req.originalUrl.split('/')[0], req.ip);
		require('../services/traffic').addView({
			url: req.originalUrl,
			ip: req.ip,
			referrer: req.get('referrer')
		}, function (views, uniqueViews) {
			req.contest.views = views;

			next();
		});
	};
};