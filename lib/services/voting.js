/**
 * User: AustinFloyd
 * Date: 2/1/13
 * Time: 2:53 PM
 */

var Beer = require('../models').Beer,
	User = require('../models').User,
	http = require('http');

module.exports = function (opts) {
	return function (opts) {
		var socket = opts.socket,
			app = opts.app,
			user = socket.handshake.user;
		socket.on('cast vote', function (message) {
			console.log('incoming authenticated vote: ', message);
			Beer.find({}, function (err, beers) {
				if (err) {
					console.error('error querying beers: ', err);
				}

				var hasVoted = false;
				var beerToVoteUp;
				beers.forEach(function (beer) {
					if (beer.name === message) {
						beerToVoteUp = beer;
					}
					beer.votes.forEach(function (vote) {
						if (vote.authId === user.authId && vote.authType === user.authType) {
							hasVoted = true;
							return socket.emit('already voted', 'Sorry you can only vote once');
						}
					});
				});


				if (!hasVoted && beerToVoteUp) {
					castRemoteVote(user.authId, beerToVoteUp.id, function (err) {
						if (err) { return console.error('error casting remote vote: ', err); }

						beerToVoteUp.votes.push({
							authId: user.authId,
							authType: user.authType
						});

						User.findById(user._id, function (err, user) {
							if (err) { return console.log('error retrieving user to add that they voted'); }

							user.voted = true;
							user.save();
						});

						beerToVoteUp.markModified('votes');
						return beerToVoteUp.save(function () {
							console.log('updating global connected sockets');
							socket.emit('thanks', 'Thanks for your vote!!')
							app.io.sockets.emit('vote update', {
								name: beerToVoteUp.name,
								votes: beerToVoteUp.votes.length
							});
						});
					});
				}
			});
		});
	}
};


var querystring = require('querystring'),
	http = require('http'),
	remoteTest = process.env['remote_test'] ? 'testing-' : '';

function castRemoteVote(userId, beerId, cb) {
	return cb(null);

	var post_data = JSON.stringify({
		developer: '777',
		user: '777-' + remoteTest + userId,
		beer: beerId
	});

	var post_options = {
		host: 'appsworld.raxdrg.com',
		port: 80,
		path: '/api/',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': post_data.length
		}
	};

	console.log('posting to remote for userId: ' + userId);
	var post_req = http.request(post_options, function(res) {
		console.log('Appfog cast vote STATUS: ' + res.statusCode);
		if (res.statusCode === 204) {
			cb(null);
		} else {
			cb('something happened', res.statusCode);
		}

		//TODO: is this needed?? don't think so...
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			console.log('Response: ' + chunk);
		});
	});

	// write parameters to post body
	post_req.write(post_data);
	post_req.end();
}