var Beer = require('../lib/models').Beer;
var reCaptcha = require('recaptcha-async').reCaptcha,
	reCaptchaPubKey = process.env['recaptcha_pub_key'],
	reCaptchaPrivKey = process.env['recaptcha_priv_key'],
	ajaxResponse = require('../lib/ajaxResponse'),
	User = require('../lib/models').User,
	util = require('../lib/util');

module.exports = function (app) {
	app.post(/\/auth\/captcha/, function (req, res, next) {
		if (!req.isJSON) { return next(); }

		var challenge = req.body.challenge || '',
			answer = req.body.answer || '';
		console.log(challenge, answer);

		var captcha = new reCaptcha();
		captcha.on('data', function (response) {
			if(!response.is_valid){
				ajaxResponse.success({isValid: false}, res);
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
			beers.map(function (beer) {
				delete beer.id; //don't give away the ids, lol!!
				beer.votes = beer.votes.length;
			});

			var alreadyVoted = false,
				reCaptchaHtml = '';
			if (req.user) {
				alreadyVoted = !!req.user.voted;
			} else {
				reCaptchaHtml = new reCaptcha().getCaptchaHtml(reCaptchaPubKey);
			}

			res.render('index', {
				title: 'Cast your vote!',
				beers: beers,
				alreadyVoted: alreadyVoted,
				reCaptchaHtml: reCaptchaHtml
			});
		})
	});
};