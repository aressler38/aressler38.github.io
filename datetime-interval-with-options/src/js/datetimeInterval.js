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
