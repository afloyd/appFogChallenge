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

	app.locals.siteTitle = 'Apps & Beers Contest';
	app.locals.moment = require('moment');

	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(require('less-middleware')({ src: __dirname + '/public' }));//was after router
	app.use(express.favicon());
	addSessionHandler(express, app);
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
	var passport = require('passport');
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);

	app.configure('development', function(){
		app.use(express.errorHandler());
	});

	require('./routes/about')(app);
	require('./routes/open-auth')({app: app});
	require('./routes/index')(app);//handle all other route requests, no 404's outside of statically served files!!

	var server = http.createServer(app).listen(app.get('port'), function(){
		console.log("Express server listening on port " + app.get('port'));
	});

	require('./lib/init-socket-io')({
		app: app,
		server: server,
		mongoSessionStore: mongoSessionStore
	});

	var beerService = require('./lib/services/beer');
	beerService.addBeers();
	beerService.pollForNewBeers();
});

function addSessionHandler(express, app) {
	var MongoStore = require('connect-mongo')(express);
	mongoSessionStore = new MongoStore(conf.mongoSession.db);

	app.use(express.cookieParser());
	app.use(express.session({
		secret: conf.mongoSession.secret,
		key: conf.mongoSession.key,
		cookie: { maxAge: 691200000 }, // 1000(ms) * 60(sec) * 60(min) * 24(hr) * 8(days) -- after competition ends
		expires: true,
		store: mongoSessionStore
	}));
}