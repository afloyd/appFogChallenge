
/**
 * Module dependencies.
 */

var express = require('express'),
	app = express(),
	mongoSessionStore,
	conf;
	app.geeks = {};

require("./lib/logging")();

require('./lib/init').start(app).on('complete', function() {
	conf = global.conf;

	var http = require('http'),
		path = require('path');

	app.locals.siteTitle = 'App & Beers Contest';
	app.locals.moment = require('moment');

	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(require('less-middleware')({ src: __dirname + '/public' }));//was after router
	app.use(express.favicon());
	app.use(express.logger());
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(function (req, res, next) {
		req.isJSON = req.headers.accept && req.headers.accept.indexOf('/json') > -1;
		next();
	});
	app.use(require('./lib/middleware/request-context')());
	app.use(require('./lib/middleware/traffic-logger')());
	app.use(require('./lib/middleware/render-context')());

	app.use(express.static(path.join(__dirname, 'public')));
	app.use(app.router);

	app.configure('development', function(){
		app.use(express.errorHandler());
	});

	require('./routes/about')(app);
	require('./routes/index')(app);//handle all other route requests, no 404's outside of statically served files!!

	var server = http.createServer(app).listen(app.get('port'), function(){
		console.log("Express server listening on port " + app.get('port'));
	});

	require('./lib/init-socket-io')({
		app: app,
		server: server,
		mongoSessionStore: mongoSessionStore
	});

	var Beer = require('./lib/models').Beer;
	Beer.find({}, function (err, beers) {
		if (!beers.length) {
			//get the beer list!
			require('http').get('http://appsworld.raxdrg.com/api/beers',
				function (res) {
					res.setEncoding('utf8');
					res.on('data', function (data) {
						var response = JSON.parse(data);
						if (response.beers) {
							response.beers.forEach(function (beer) {
								console.log(beer);
								new Beer({ beerId: beer.id, name: beer.name }).save();
							});
						}
					});
					res.on('error', function (err) {
						console.error(err);
					})
			});
		}
	});
});