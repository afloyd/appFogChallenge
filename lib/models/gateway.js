var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

/**
 * Gateway Schema
 */
var GatewaySchema = new Schema({
	id: { type: String },
   	tenant: { type: String },
	groupEquations: {},
	registers: {},
	resources: {},
	resourceId: { type: String },
	tags: []
}, { strict: 'throw' });

GatewaySchema.statics.findBy = function facilityFindBy(gatewayId, cb) {
	return this.findOne({ _id: gatewayId }, cb);
};

// export the schema
module.exports = GatewaySchema;