/**
 * User: AustinFloyd
 * Date: 1/26/13
 * Time: 3:18 PM
 */

var TrafficModel = require('../models').Traffic;

function addView(opts, cb) {
	TrafficModel.findByUrl(opts.url, function (err, traffic) {
		var now = Date.now();
		opts.referrer = opts.referrer || '';
		if (traffic) {
			traffic.views++;
			var visitor;
			traffic.visitors.some(function (thisVisitor) {
				if (thisVisitor.ip === opts.ip) {
					visitor = thisVisitor;
					return true;
				}
				return false;
			});

			if (visitor) {
				visitor.views++;
				visitor.viewTimestamps.push(now);
			}
			else {
				traffic.visitors.push({
					views: 1,
					ip: opts.ip,
					viewTimestamps: [now]
				});
			}

			var referrerFound = false;
			traffic.referrers.some(function (referrer) {
				if (referrer.url === opts.referrer) {
					referrer.timestamps.push(now);
					referrerFound = true;
					return true;
				}
				return false;
			});
			if (!referrerFound) {
				traffic.referrers.push({ url: opts.referrer, timestamps: [now] });
			}

			traffic.markModified('visitors');
			traffic.markModified('viewTimestamps');
			traffic.markModified('referrers');
			traffic.save(function (err) {
				if (err) console.error('Error saving traffic: ', err);
			});
			return cb(traffic.views, traffic.uniqueViews);
		}

		var traffic = new TrafficModel({
			url: opts.url,
			views: 1,
			uniqueViews: 1,
			referrers: [{ url: opts.referrer, timestamps: [now] }],
			visitors: [{
				ip: opts.ip,
				views: 1,
				viewTimestamps: [now]
			}]
		});
		traffic.save(function (err) {
			if (err) console.error('Error saving traffic: ', err);
		});
		cb(traffic.views, traffic.uniqueViews);
	});
};

module.exports = {
	addView: addView
};