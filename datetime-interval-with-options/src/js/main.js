'use strict';

var globals          = require('./globals');
var urlParameters    = require('./urlParameters');
var datetimeInterval = require('./datetimeInterval');
var options          = require('./options');



/**
 * This is the controller and glue of the app.
 * We check the url parameters, and bind events
 * from the date time widget.
 * This also implements the business logic of 
 * what options should be displayed and when.
 */
(function main () {

	var params, date, urlToDate, urlFromDate;

	params = urlParameters.getParams();

	// initial setup of the dates
	date = new Date(params.to); 
	urlToDate = Number.isNaN(date.getTime()) ?
		new Date(Date.now() + 1000 * 3600 * 24 + 7777777) // default date
		: date ;
	date = new Date(params.from);
	urlFromDate = Number.isNaN(date.getTime()) ?
		new Date() // default date
		: date ;


	// Bind to the date time interval's onchange event
	datetimeInterval.onchange = update;

	// initialize UI
	datetimeInterval.time.to = urlToDate;
	datetimeInterval.time.from = urlFromDate;
	updateUrlParams();

	/**
	 * Get the dates as ISO strings and update the url parameters via
	 * the HTML5 History API.
	 */
	function updateUrlParams () {
		var to = new Date(datetimeInterval.time.to);
		var from = new Date(datetimeInterval.time.from);
		history.replaceState(null, null, '?from='+from.toISOString()+'&to='+to.toISOString());
	}


	/**
	 * Any time something changes, update should execute to update the DOM and url query string.
	 */
	function update () {
		options.clear();
		getAvailableOptions(datetimeInterval.time.length()).forEach(function (optionId) {
			options.get(optionId).selected = true;
		});
		updateUrlParams();
	}


	/**
	 * This is the business logic for filtering the available options.
	 */
	function getAvailableOptions (t) { 
		var availableOptions = [0, 1, 2, 3, 4];
		if ( 7 * globals.msPerDay <= t ) {
			availableOptions.shift();
		}
		if ( 31 * globals.msPerDay <= t ) {
			availableOptions.shift();
		}
		if ( 366 * globals.msPerDay <= t ) {
			availableOptions.shift();
		}
		if ( t < 0 ) {
			while ( availableOptions.length ) {
				availableOptions.pop();
			}
		}
		return availableOptions;
	}



})();
