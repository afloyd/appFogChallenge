/**
 * User: AustinFloyd
 * Date: 2/1/13
 * Time: 8:17 PM
 */

var passport = require('passport'),
	FacebookStrategy = require('passport-facebook').Strategy,
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

	passport.use(new FacebookStrategy({
			clientID: '333563403426755',
			clientSecret: 'c07a6fb49a5550ca2ec3243a2117cbaf',
			callbackURL: "http://local.host:3000/auth/facebook/callback"/*"http://favbeer.rs.af.cm/auth/facebook/callback"*/
		},
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
};