'use strict';

/**
 * A helper for URLs and the search bar.
 * @singleton
 */
module.exports = new function () {

	/**
	 * Returns an object mapping url parameter keys to their values.
	 */
	this.getParams = function () {
		var params = { };
		// strip off '?', split on '&' and gather key/value pairs
		location.search.substring(1)
			.split('&')
			.map(function (paramPair) {
				return paramPair.split('=');
			}).forEach(function(pair) {
				params[pair[0]] = pair[1];
			});
		return params;
	};

};
