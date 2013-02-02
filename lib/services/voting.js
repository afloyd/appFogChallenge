/**
 * User: AustinFloyd
 * Date: 2/1/13
 * Time: 2:53 PM
 */

var Beer = require('../models').Beer,
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
					castRemoteVote(user.authId, beerToVoteUp.id, function (err, message) {
						if (err) { return console.error('error casting remote vote: ', err); }

						beerToVoteUp.votes.push({
							authId: user.authId,
							authType: user.authType
						});

						beerToVoteUp.markModified('votes');
						return beerToVoteUp.save(function () {
							console.log('updating global connected sockets');
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
	http = require('http');

//{ "developer":developer-id, "user":user-id, "beer":beer-id }
function castRemoteVote(userId, beerId, cb) {
	var post_data = querystring.stringify({
		developer: '777',
		user: 'testing',//userId,
		beer: beerId
	});

	var post_options = {
		host: 'get.appfog.com',
		port: 80,
		path: '/e/17092/api-/767jd/290366051',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': post_data.length
		}
	};

	console.log('posting to remote');
	var post_req = http.request(post_options, function(res) {
		console.log('Appfog cast vote STATUS: ' + res.statusCode);
		if (res.statusCode === 204) {
			cb(null, 'success');
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