var Beer = require('../lib/models').Beer;

module.exports = function (app) {
	app.get(/./, function(req, res){
		Beer.find({}, function (err, beers) {
			beers.map(function (beer) {
				delete beer.id; //don't give away the ids, lol!!
			});
			res.render('index', {
				title: 'Cast your vote!',
				beers: beers
			});
		})
	});
};