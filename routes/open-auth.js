/**
 * User: AustinFloyd
 * Date: 2/1/13
 * Time: 8:17 PM
 */

var passport = require('passport'),
	FacebookStrategy = require('passport-facebook').Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
	User = require('../lib/models').User;

module.exports = function (opts) {
	var app = opts.app;
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	var fbConf = global.conf.facebook;
	fbConf.callbackURL = 'http://' + fbConf.host + '/auth/facebook/callback';
	delete fbConf.host;

	passport.use(new FacebookStrategy(fbConf,
		function(accessToken, refreshToken, profile, done) {
			//console.log('profile: ', profile);
			User.findOne({authType: 'facebook', authId: profile.id }, function(err, user) {
				if (err) { console.error('error getting profile from DB', err); return done(err); }

				if (!user) {
					var user =  new User({
						authType: 'facebook',
						authId: profile.id,
						firstName: profile.first_name,
						lastName: profile.last_name

					});
					user.save(function () {
						done(null, user);
					});
				}
			});
		}
	));
	app.get('/auth/facebook', passport.authenticate('facebook'));
	app.get('/auth/facebook/callback',
			passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/' }));

	var twitterConf = global.conf.twitter;
	twitterConf.callbackURL = 'http://' + twitterConf.host + '/auth/twitter/callback';
	delete twitterConf.host;

	passport.use(new TwitterStrategy(twitterConf,
		  function(accessToken, refreshToken, profile, done) {
			  console.log('profile: ', profile);
			  User.findOne({authType: 'facebook', authId: profile.id }, function(err, user) {
				  if (err) { console.error('error getting profile from DB', err); return done(err); }

				  if (!user) {
					  var nameSplit = profile.displayName ? (profile.displayName.split(' ') || []) : [];
					  var user =  new User({
						   authType: 'twitter',
						   authId: profile.id,
						   firstName: nameSplit[0] || undefined,
						   lastName: nameSplit[1] || undefined

					  });
					  user.save(function () {
						  done(null, user);
					  });
				  }
			  });
		  }
	));
	app.get('/auth/twitter', passport.authenticate('twitter'));
	app.get('/auth/twitter/callback',
			passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/' }));
};