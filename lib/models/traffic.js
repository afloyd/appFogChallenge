var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

/**
 * Site Schema
 */
var TrafficSchema = new Schema({
	url: { type: String, required: true },
	views: { type: Number, default: 1, required: true },
	referrers: [],
	uniqueViews: { type: Number, default: 1, required: true },
	visitors: []
}, { strict: 'throw' });

TrafficSchema.statics.findByUrl = function facilityFindBy(url, cb) {
	return this.findOne({ url: url }, cb);
};

// export the schema
module.exports = TrafficSchema;