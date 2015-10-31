(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var globals = require("./globals");

/**
 * @name datetimeInterval
 * @singleton
 * @description
 * Manages updates to the time DOM input elements.
 * Provides an interface to get the details of the
 * time interval via the `time` property.
 * @todo It's setup as a singleton to match the DOM, but it could be made instantiable...
 */
module.exports = new function () {

	var self = this;

	var rHrMin = /(\d+):(\d+)/;
	var rDate = /\d+-\d+-\d+/;
	var rTime = /\d+:\d+/;

	var msPerDay = globals.msPerDay;
	var msPerHour = globals.msPerHour;
	var msPerMin = globals.msPerMin;

  this.onchange = null; // An event hook

	// DOM elements
	var elements = {
		from : {
			date : document.getElementById('from-date'),
			time : document.getElementById('from-time')
		},
		to : {
			date : document.getElementById('to-date'),
			time : document.getElementById('to-time')
		},
		display : document.getElementById('time-display')
	};


	/**
	 * @public
	 * @name time
	 * Exposes the numerical values of the time interval endpoints.
	 */
	this.time = {
		length : function () { return this.to - this.from; }
	};
	Object.defineProperty(this.time, 'from', {
		get : function () {
			return getDate(elements.from.date) + getTime(elements.from.time);
		},
		set : setTimeElements.bind(elements.from)
	});
	Object.defineProperty(this.time, 'to', {
		get : function () {
			return getDate(elements.to.date) + getTime(elements.to.time);
		},
		set : setTimeElements.bind(elements.to)
	});


	// Bindings
	bindUpdateEventHandler(elements);

	/**
	 * @this to or from object in the elements object
	 */
	function setTimeElements (date) {
		this.date.value = date.toISOString().match(rDate)[0];
		this.time.value = date.toISOString().match(rTime)[0];
		update.call(self);
	}

	// ===============
	// Private Methods
	// ===============


	/**
	 * walk the elements tree and bind change handlers to the inputs
	 */
	function bindUpdateEventHandler (obj) {
		for ( var key in obj ) {
			if ( obj[key].ELEMENT_NODE ) {
			 	if ( obj[key].nodeName === 'INPUT' ) {
					obj[key].onchange = update.bind(self);
				}
			} else {
				bindUpdateEventHandler(obj[key]);
			}
		}
	}


	/**
	 * Check for time errors, and update the display element's text.
	 * Call onchange if it's truthy and the time interval is valid.
	 * @this - The scope of the module.
	 */
	function update () {
		var delta = this.time.length();
		if ( delta < 0 ) {
			elements.display.innerHTML =  'Invalid Interval (to date is less than from date)';
		} else if ( Number.isNaN(delta) ) {
			elements.display.innerHTML =  'Invalid Date';
		} else {
			elements.display.innerHTML =  ['Time Interval:',
				Math.floor(delta / msPerDay), 'days',
				Math.floor(delta / msPerHour) % 24, 'hours',
				Math.floor(delta / msPerMin) % 60, 'minutes' ].join(' ') ;
			this.onchange && this.onchange();
		}
	}


	/**
	 * @return {number} The numerical value represented by a date input.
	 */
	function getDate (el) {
		var date = new Date(el.value);
		if ( date !== null ) {
			return date.getTime();
		} else {
			return 0;
		}
	}


	/**
	 * @return {number} The numerical value represented by a time input minus epoch time.
	 */
	function getTime (el) {
			var time = el.value.match(rHrMin);
			return time ?
				(+time[1]) * msPerHour + (+time[2]) * msPerMin
				: 0 ;
	}


};

},{"./globals":2}],2:[function(require,module,exports){
/**
 * Holds global variables and time constants.
 */
module.exports = {
	msPerDay : 1000 * 3600 * 24,
	msPerHour : 1000 * 3600,
	msPerMin : 60000
};

},{}],3:[function(require,module,exports){
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

},{"./datetimeInterval":1,"./globals":2,"./options":4,"./urlParameters":5}],4:[function(require,module,exports){
'use strict';


/**
 * @singleton
 */
module.exports = new function () {

	// TODO: use a WeakMap

	var views = [];
	var elements = Array.prototype.slice.call(
			document.getElementById('options').querySelectorAll('li'), 0);


	// create the views and put them into the parallel array
	elements.forEach(function(el) {
		views.push(new OptionView(el));
	});


	/**
	 * Return a particular view, or return the list of views.
	 *
	 * @param {number} idx
	 */
	this.get = function (idx) {
		if ( idx === undefined ) {
			return views;
		} else {
			return views[idx];
		}
	};

	/**
	 * Clear all the views
	 */
	this.clear = function () {
		views.forEach(function (view) {
			view.selected = false;
		});
	};


	/**
	 * Nothing but a wrapper around a DOM element
	 * providing a hook to select and deselect
	 * the element.
	 * @param {DOMElement} el
	 */
	function OptionView (el) {
		Object.defineProperty(this, 'selected', {
			get : function () { return active; },
			set : function (bool) {
				if ( bool ) {
					el.classList.add('selected')
				}	else {
					el.classList.remove('selected')
				}
			}
		});
	}

};

},{}],5:[function(require,module,exports){
'use strict';

/**
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

},{}]},{},[1,2,3,4,5]);
