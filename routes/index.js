var Beer = require('../lib/models').Beer;
var reCaptcha = require('recaptcha-async').reCaptcha,
	reCaptchaPubKey = process.env['recaptcha_pub_key'],
	reCaptchaPrivKey = process.env['recaptcha_priv_key'],
	ajaxResponse = require('../lib/ajaxResponse'),
	User = require('../lib/models').User,
	util = require('../lib/util'),
	maxCaptchaRetries = 3;

var beerInfoLinks = {
	1: 'https://www.google.com/search?q=Widmer+Hefeweisen',
	2: 'http://www.ratebeer.com/beer/sierra-nevada-pale-ale-bottle-can/365/',
	3: 'http://en.wikipedia.org/wiki/Stella_Artois',
	4: 'http://en.wikipedia.org/wiki/Lagunitas_Brewing_Company#IPA_.28India_Pale_Ale.29',
	5: 'http://en.wikipedia.org/wiki/Newcastle_Brown_Ale',
	6: 'http://en.wikipedia.org/wiki/Guinness'
};

module.exports = function (app) {
	app.get(/\/auth\/no-captcha/, function (req, res, next) {
		if (!req.isJSON/* && req.session.captchaRetries && req.session.captchaRetries >= maxCaptchaRetries*/) {
			var authId = util.getRandomToken();
			User.findOne({authType: 'noCaptcha', authId: authId }, function(err, user) {
				if (err) {
					console.error('error getting user from DB', err);
					res.redirect('/');
				}

				if (!user) {
					var user =  new User({
											 authType: 'noCaptcha',
											 authId: authId
										 });
					user.save(function (err, savedUser) {
						if (err) {
							console.error('error saving noCaptcha user to DB', err, user);
							return ajaxResponse.error('error saving noCaptcha user', next);
						}
						req.session.passport = { user: savedUser._id };
						res.redirect('/');
					});
				}
			});
		}
	});

	app.post(/\/auth\/captcha/, function (req, res, next) {
		if (!req.isJSON) { return next(); }

		var challenge = req.body.challenge || '',
			answer = req.body.answer || '';
		console.log(challenge, answer);

		var captcha = new reCaptcha();
		captcha.on('data', function (response) {
			if(!response.is_valid){
				var retries = req.session.captchaRetries;
				retries = req.session.captchaRetries = !retries ? 1 : ++retries;
				var html;
				if (retries >= maxCaptchaRetries) {
					html = '<span>I see you\'re having a hard time with reCaptcha... Just ' +
							'<a href="/auth/no-captcha">Click here</a> to vote without it</span>';
				}

				ajaxResponse.success({isValid: false, html: html}, res);
			} else {
				var authId = util.getRandomToken();
				User.findOne({authType: 'reCaptcha', authId: authId }, function(err, user) {
					if (err) {
						console.error('error getting user from DB', err);
						return ajaxResponse.error('error searching user', next);
					}

					if (!user) {
						var user =  new User({
							 authType: 'reCaptcha',
							 authId: authId
						});
						user.save(function (err, savedUser) {
							if (err) {
								console.error('error saving captcha user to DB', err, user);
								return ajaxResponse.error('error saving captcha user', next);
							}
							req.session.passport = { user: savedUser._id };
							ajaxResponse.success({isValid: true}, res);
						});
					}
				});
			}
		});

		captcha.checkAnswer(reCaptchaPrivKey, req.ip, challenge, answer);
	});

	app.get(/./, function(req, res){
		Beer.find({}, function (err, beers) {
			var beersForUi = [];
			beers.forEach(function (beer) {
				beer = beer.toObject();
				delete beer.id; //don't give away the ids, lol!!
				beer.votes = beer.votes.length;
				beer.url = beerInfoLinks[beer.beerId];
				beersForUi.push(beer);
			});

			var alreadyVoted = false,
				reCaptchaHtml = '';
			if (req.user) {
				alreadyVoted = !!req.user.voted;
				return res.render('index', {
					title: 'Cast your vote!',
					beers: beersForUi,
					alreadyVoted: alreadyVoted,
					reCaptchaHtml: reCaptchaHtml
				});
			} else {
				var authId = util.getRandomToken();
				User.findOne({authType: 'noCaptcha', authId: authId }, function(err, user) {
					if (err) {
						console.error('error trying to create new user, duplicate userId in DB', err);
						res.redirect('/');
					}

					if (!user) {
						var user =  new User({
							authType: 'no-captcha-',
							authId: authId
						});
						user.save(function (err, savedUser) {
							if (err) {
								console.error('error saving noCaptcha user to DB', err, user);
								return ajaxResponse.error('error saving noCaptcha user', next);
							}
							req.session.passport = { user: savedUser._id };


							res.render('index', {
								title: 'Cast your vote!',
								beers: beersForUi,
								alreadyVoted: false,
								reCaptchaHtml: reCaptchaHtml
							});
						});
					}
				});
				//reCaptchaHtml = new reCaptcha().getCaptchaHtml(reCaptchaPubKey);
			}
		})
	});
};