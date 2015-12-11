'use strict';


/**
 * A renderer is inserted in to the render queue.
 * It's callback will be executed on each frame and will be passed the current time.
 */
class Renderer {
	/**
	 * @param {function} callback - EXAMPLE: foo(time) { console.log('the time is:'+time; }
	 * @param {number} duration - Indicate how long before this renderer should expire.
	 */
	constructor (callback, duration) {
		this.initT = Date.now();
		this.d = duration;
		this.callback = callback;
		this.isExpired = false;
	}
	// t is the current time for the animation passed by the render loop machine.
	/**
	 * Check if the renderer is expired, and executed the callback
	 */
	render (t) {
		this.isExpired = t - this.initT > this.d;
		this.callback.call(null, t);
	}
}


module.exports = Renderer;
