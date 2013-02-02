/**
 * User: AustinFloyd
 * Date: 11/7/12
 * Time: 10:25 AM
 */

var bcrypt = require('bcrypt-nodejs');

/**
 * Gets a random token
 * @return {String} The random token
 */
function getRandomToken () {
	var rand = bcrypt.genSaltSync(10, 30);
	// store as base64-encoded value
	return new Buffer(rand).toString('base64');
}

module.exports = {
	/**
	 * Gets a random token
	 * @return {String} The random token
	 */
	getRandomToken: getRandomToken
};