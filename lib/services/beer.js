/**
 * User: AustinFloyd
 * Date: 2/2/13
 * Time: 4:50 PM
 */

var Beer = require('../models').Beer,
	http = require('http'),
	beerService = module.exports = {};

var beers = [
	{
		id: 1,
		name: 'Widmer Hefeweisen'
	}, {
		id: 6,
		name: 'Guiness Stout'
	}, {
		id: 2,
		name: 'Sierra Nevada Pale Ale'
	}, {
		id: 5,
		name: 'Newcastle Brown Ale'
	}, {
		id: 3,
		name: 'Stella Artois'
	}, {
		id: 4,
		name: 'Lanunitas IPA'
	}];

beerService.addBeers = function () {
	Beer.find({}, function (err, dbBeers) {
		var newBeerFound = false;
		beers.forEach(function (newBeer) {
			var beerExists = dbBeers.filter(function (dbBeer) {
				return dbBeer.name === newBeer.name;
			}).length;
			if (!beerExists) {
				console.log('new beer added!', newBeer);
				newBeerFound = true;
				new Beer({ beerId: newBeer.id, name: newBeer.name }).save();
			}
		});
		if (!newBeerFound) {
			console.log('no new beers found.');
		}
	});
	/*
	//Code to get beer from remote API
	http.get('http://appsworld.raxdrg.com/api/beers',
		 function (res) {
			 res.setEncoding('utf8');
			 res.on('data', function (data) {
				 var response = JSON.parse(data);
				 if (response.beers) {
					 Beer.find({}, function (err, dbBeers) {
						 var newBeerFound = false;
						 response.beers.forEach(function (newBeer) {
							 var beerExists = dbBeers.filter(function (dbBeer) {
								 return dbBeer.name === newBeer.name;
							 }).length;
							 if (!beerExists) {
								 console.log('new beer added!', newBeer);
								 newBeerFound = true;
								 new Beer({ beerId: newBeer.id, name: newBeer.name }).save();
							 }
						 });
						 if (!newBeerFound) {
						 	console.log('no new beers found.');
						 }
					 });
				 }
			 });
			 res.on('error', function (err) {
				 console.error(err);
			 });
		 });*/
};

beerService.pollForNewBeers = function () {
	setInterval(function () {
		console.log('polling for new beers');
		beerService.addBeers();
	}, 900000); //Poll every 15 minutes for new beer updates
};