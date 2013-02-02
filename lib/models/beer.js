/**
 * User: AustinFloyd
 * Date: 2/1/13
 * Time: 12:13 PM
 */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

/**
 * Site Schema
 */
var BeerSchema = new Schema({
		beerId: { type: String, required: true },
		name: { type: String, require: true },
		votes: { type: Number, default: 0, required: true }
   }, { strict: 'throw' });

BeerSchema.statics.findByBeerId = function findByBeerId(id, cb) {
	return this.findOne({ beerId: id }, cb);
};

// export the schema
module.exports = BeerSchema;