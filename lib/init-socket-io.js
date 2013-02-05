var parseCookie = require('express/node_modules/cookie').parse;
	parseSignedCookies = require('express/node_modules/connect/lib/utils').parseSignedCookies,
	Session = require('express/node_modules/connect').session.Session,
	enableVoting = require('./services/voting')(),
	User = require('./models').User,
	usersOnline = 0,
	TrafficService = require('./services/traffic');

module.exports = function (opts) {
	var app = opts.app,
		server = opts.server,
		mongoSessionStore = opts.mongoSessionStore;

	app.io = require('socket.io').listen(server);
	app.io.set('log level', 2);
	//global authorization
	app.io.set('authorization', function (data, accept) {
		if (!data.headers.cookie) {
			return accept('No cookie transmitted.', false);
		}

		var signedCookies = parseCookie(data.headers.cookie);
		data.cookies = parseSignedCookies(signedCookies, conf.mongoSession.secret);
		data.sessionId = data.cookies[conf.mongoSession.key];
		// (literally) get the session data from the session store
		data.sessionStore = mongoSessionStore;
		mongoSessionStore.get(data.sessionId, function (err, session) {
			if (err || !session) {
				// if we cannot grab a session, turn down the connection
				return accept('Error', false);
			}

			// save the session data and accept the connection
			data.session = new Session(data, session);
			accept(null, true);
		});
	});

	var lastChats = [];
	function addChat(message) {
		if (lastChats.length < 10) {
			return lastChats.push(message);
		}

		lastChats.shift().push(message);
	}

	// Keep the session fresh
	app.io.sockets.on('connection', function (socket) {
		console.log('connected to base');
		var hs = socket.handshake;
		usersOnline++;
		app.io.sockets.emit('users online', usersOnline);
		TrafficService.getViews('/', function (err, count) {
			app.io.sockets.emit('page views', count);
		});

		if (socket.handshake.alias) {
			app.io.sockets.emit('chat message', socket.handshake.alias + ' has re-connected\n');
		} else if (!socket.handshake.initialized) {
			socket.emit('chat message', 'Please don\'t forget to vote on the left if you haven\'t already, thanks! :)\n');
			socket.handshake.initialized = true;
		}
		lastChats.length && socket.emit('chat message', 'Last few chats recorded:\n');
		lastChats.forEach(function (message) {
			socket.emit('chat message', message);
		});

		socket.on('set alias', function (alias) {
			console.log('set alias', alias);
			if (alias.length) {
				var oldAlias = socket.handshake.alias;
				socket.handshake.alias = alias;
				socket.emit('alias set');
				if (!oldAlias) {
					return app.io.sockets.emit('chat message', 'Welcome ' + alias + ' to chat!\n');
				}
				app.io.sockets.emit('chat message', '\'' + oldAlias + '\' alias changed to \'' + alias + '\'\n');
			}
		}).on('send message', function (message) {
			if (message.length && message.match(/^ca`/g)) {
				app.io.sockets.emit('clear all');
				lastChats = [];
			} else if (message.length && message.match(/^cm`/g)) {
				var regex = message.split('`')[1];
				var cleanRegex = new RegExp(regex, 'g');
				lastChats.map(function (message) {
					return (message = message.replace(cleanRegex, ''));
				});
				app.io.sockets.emit('clean messages', cleanRegex);
				console.log('clean phrase: ', regex);
			} else if (message.length) {
				var message = socket.handshake.alias + ': ' + message + '\n';
				console.log('chat message-- ', message);
				addChat(message);
				app.io.sockets.emit('chat message', message);
			}
		});

		var intervalId = setInterval(function () {
			// reload the session (just in case something changed,
			// we don't want to override anything, but the age)
			// reloading will also ensure we keep an up2date copy
			// of the session with our connection (especially for load-balanced apps!).
			hs.session.reload(function () {
				// "touch" it (resetting maxAge and lastAccess)
				// and save it back again.
				hs.session.touch().save();/*function () {
					console.log('sessionId: ' + hs.sessionId + ' touched');
				});*/
			});
		}, 60*1000);

		socket.on('disconnect', function () {
			console.log('authorized socket sessionId ' + hs.sessionId + ' disconnected');
			clearInterval(intervalId);
			usersOnline--;
			usersOnline < 0 && (usersOnline = 0); //just in case ;P
			app.io.sockets.emit('users online', usersOnline);
			if (socket.handshake.alias) {
				app.io.sockets.emit('chat message', socket.handshake.alias + ' has disconnected\n');
			}
		});
	});

	// /vote authorization
	app.io.of('/vote').authorization(function (data, accept) {
		// (literally) get the session data from the session store
		data.sessionStore = mongoSessionStore;
		//console.log('connected with session authorization, sessionID: ', hs.sessionId);
		mongoSessionStore.get(data.sessionId, function (err, session) {
			if (err || !session) {
				// if we cannot grab a session, turn down the connection
				return accept('Error', false);
			}

			// save the session data and accept the connection
			data.session = new Session(data, session);
			var acceptConnection = data.session.passport && data.session.passport.user;
			if (acceptConnection) {
				User.findById(data.session.passport.user, function (err, user) {
					if (err || !user) {
						console.error('error retrieving session user');
						return accept(null, false);
					}
					data.user = user.toObject();
					console.log('authorizing /vote socket: ' + acceptConnection + '. authId: ' + user.authId);
					return accept(null, acceptConnection);
				});
			}

			accept(null, false);
		});
	}).on('connection', function (socket) {
	  	enableVoting({
			app: app,
			socket: socket
		});
  	});
};