var EventEmitter = require('events').EventEmitter,
	path = require('path'),
	util = require('./util'),
	jade = require('jade'),
	moment = require('moment'),
	extend = require('../lib/extend'),
	fs = require('fs'),
	conf;

var init = module.exports = {
	start: start,
	event: new EventEmitter(),
	getConfig: getConfig
};

function start(app) {
	// allow code requiring us a chance to register a 'complete' handler before we start
	process.nextTick(function() {
		console.log('Running pre-initialization script');

		// time init process
		var start = Date.now();

		// load and expose `conf` object globally
		conf = global.conf = getConfig();

		// connect to mongo app db\
		getMongoConnection();

		console.log('Pre-initialization complete');
		init.event.emit('complete');
	});
	return init.event;
}

function getConfig() {
	var confPath = path.resolve(__dirname, path.join('..', path.sep, 'config.json'));

	try {
		var conf = require(confPath);
	} catch (err) {
		console.error('Error while loading config file');
		throw err;
	}

	if (!conf) {
		throw new Error('Unknown error while loading config file "' + confPath + '"');
	}
	console.log('Loaded config file ' + confPath);
	return conf;
}

function getMongoConnection() {
	var mongoMain = getMongoCredentials('db_url')
	mongoMain = mongoMain ? mongoMain.url : 'localhost:27017/contest';

	var mongoSession = getMongoCredentials('db_session') || {
		host: 'localhost',
		port: 27017,
		db: 'geeks-session',
		collection: 'sessions'
	};
	global.conf.mongoSession.db = mongoSession;

	if (!mongoMain || !mongoSession ){
		throw new Error('Mongo host and DB not specified or specified incorrectly');
	}
	return require('mongoose').connect(mongoMain);
}

function getMongoCredentials(envVar, db) {
	var mongoCreds;
	if(process.env[envVar]){
		mongoCreds = JSON.parse(process.env[envVar]);
	}

	return mongoCreds;
}