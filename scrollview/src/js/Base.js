'use strict';

var renderMachine = require('./renderMachine');


class Base {

	constructor () { }

	addRenderer (renderer) {
		renderMachine.renderables.set(Date.now()+'-'+Math.random(), renderer);
	}

	// t: current time, b: begInnIng value, c: change In value, d: duration
	easeInQuart (t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	}
	easeOutQuart (t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	}
	easeInOutQuart (t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	}

}

module.exports = Base;
