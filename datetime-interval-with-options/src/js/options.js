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
