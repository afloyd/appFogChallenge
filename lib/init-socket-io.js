var enableVoting = require('./services/voting')();

module.exports = function (opts) {
	var app = opts.app,
		server = opts.server,
		mongoSessionStore = opts.mongoSessionStore;

	app.io = require('socket.io').listen(server);
	app.io.set('log level', 2);
	app.io.sockets.on('connection', function (socket) {
		console.log('connected to base');
		enableVoting({
			app: app,
			socket: socket
		});
	});
};