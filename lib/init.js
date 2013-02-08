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

		getFacebookSettings();
		getTwitterSettings();

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
	var mongoMain = getEnvironmentJson('db_url')
	mongoMain = mongoMain ? mongoMain.url : 'localhost:27017/contest';

	var mongoSession = getEnvironmentJson('db_session') || {
		host: 'localhost',
		port: 27017,
		db: 'contest',
		collection: 'sessions'
	};
	global.conf.mongoSession.db = mongoSession;

	if (!mongoMain || !mongoSession ){
		throw new Error('Mongo host and DB not specified or specified incorrectly');
	}
	return require('mongoose').connect(mongoMain);
}

function getEnvironmentJson(envVar) {
	var envJson;
	if(process.env[envVar]){
		envJson = JSON.parse(process.env[envVar]);
	}

	return envJson;
}

function getFacebookSettings() {
	global.conf.facebook = {
		clientID: process.env['fb_clientID'] || '', //THIS NEEDS TO BE SET UP!!
		clientSecret: process.env['fb_secret'] || '', //THIS NEEDS TO BE SET UP!!
		host: process.env['fb_host'] || 'local.host:3000'
	};
}

function getTwitterSettings() {
	global.conf.twitter = {
		consumerKey: process.env['twitter_key'] || '', //THIS NEEDS TO BE SET UP!!
		consumerSecret: process.env['twitter_secret'] || '', //THIS NEEDS TO BE SET UP!!
		host: process.env['twitter_host'] || 'local.host:3000'
	};
}