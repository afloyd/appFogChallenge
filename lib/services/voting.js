/**
 * User: AustinFloyd
 * Date: 2/1/13
 * Time: 2:53 PM
 */

var Beer = require('../models').Beer;

module.exports = function (opts) {
	return function (opts) {
		var socket = opts.socket,
			app = opts.app;
		socket.on('vote', function (message) {
			console.log('incoming vote: ', message);
			Beer.find({ name: message }, function (err, beer) {
				if (err) console.error(err);

				if (beer.length) {
					beer = beer[0];
					beer.votes++;
					return beer.save(function () {
						console.log('updating connected sockets');
						app.io.sockets.emit('vote update', {
							name: beer.name,
							votes: beer.votes
						});
					});
				}

				console.error('beer not found');
			});
		});
	}
};