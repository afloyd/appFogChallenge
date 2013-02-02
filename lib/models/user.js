/**
 * User: AustinFloyd
 * Date: 2/1/13
 * Time: 9:07 PM
 */

var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		ObjectId = Schema.ObjectId;

var UserSchema = new Schema({
		authId: { type: String, required: true },
		authType: { type: String, required: true },
		firstName: { type: String },
		lastName: { type: String }
	}, { strict: 'throw' }
);

UserSchema.index({ authId: 1, authType: 1 }, { unique: true });

module.exports = UserSchema;