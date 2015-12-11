(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var ViewHolder = require('./ViewHolder');

class Adapter {

}	

Adapter.ViewHolder = ViewHolder;

module.exports = Adapter;

},{"./ViewHolder":5}],2:[function(require,module,exports){
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

},{"./renderMachine":6}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
'use strict';

var Base = require('./Base');
var Renderer = require('./Renderer');
var Adapter = require('./Adapter');

window.Adapter = Adapter;

/**
 * @todo move event binding definitions out of constructor.
 */
class ScrollView extends Base {

	constructor() {
		super();
		var self = this;
		this.adapter = new Adapter();
		this.node = document.createElement('div');
		this.node.classList.add('scroll-view');

		this.velocityThreshold = 0.0;
		this.sensitivityThreshold = 16;
		this.timingFunction = this.easeOutQuart;

		this.dataset = [ ];
		this.containers = [ ];

		this.y0 = null;
		this.offset = 0;
		this.viewableTemplates = 0;

		var sharedContext = {
			dy:0,
			y0:0,
			t0:0,
			isScrolling:false,
			renderer: {}
		};

		this.node.addEventListener('touchstart', function (e) { onTouchStart.call(sharedContext, e); });
		this.node.addEventListener('touchmove', function (e) {
			if ( sharedContext.isScrolling ) {
				e.preventDefault();
				onTouchMove.call(sharedContext, e.touches[0].clientY);
			}
		});
		this.node.addEventListener('touchend', function () { onTouchEnd.call(sharedContext); });


		/**
		 * @this sharedContext
		 * @todo `self` is scrollview... once moved, need to fix this reference
		 */
		function onTouchStart (e) {
			this.t0 = Date.now();
			this.y0 = e.touches[0].clientY;
			this.dy = 0;
			this.isScrolling = true;
			// This enables touch to stop
			// If there's already a renderer, expire it to stop it.
			this.renderer.isExpired = true;
		}

		/**
		 * @this sharedContext
		 * @todo `self` is scrollview... once moved, need to fix this reference
		 */
		function onTouchMove (y) {
			this.dy = y - this.y0;
			var dyMod = this.dy % self.containerTemplateHeight;
			var isScrollingUp = this.dy >= self.containerTemplateHeight ;
			var isScrollingDown = this.dy <= -self.containerTemplateHeight ;

			if ( isScrollingUp ) { // Shift our dataset viewer.
				if ( self.offset ) { // Stay within bounds.
					this.y0 = y;
					--self.offset;
					self.shift();
				} else {
					this.renderer.isExpired = true;
					return;
				}
			}
			else if ( isScrollingDown ) { // Shift our dataset viewer.
				if ( 1+self.offset + self.viewableTemplates < self.dataset.length ) { // Stay within bounds.
					this.y0 = y;
					++self.offset;
					self.shift();
				} else {
					this.renderer.isExpired = true;
					return;
				}
			}

			//console.log(self.offset, dyMod);

			// don't scroll past the top
			if ( ! self.offset && 0 < dyMod ) {
				transformContainers(0);
				//console.debug('returning...');
				return;
			}

			// Transform the templates, so it looks like we're scrolling up or down
			transformContainers(dyMod);

		}



		function transformContainers (y) {
			for ( var i=0; i<self.containers.length; ++i ) {
				self.containers[i].style.transform = 'translate3d(0,'+((i-1)*self.containerTemplateHeight + y)+'px,0)';
			}
		}



		/**
		 * @this sharedContext
		 * @todo `self` is scrollview... once moved, need to fix this reference
		 */
		function onTouchEnd () {
			var velocity = this.dy / (Date.now() - this.t0);
			var magnitude = Math.abs(this.dy);

			this.isScrolling = false;
			this.dy = 0;
			this.y0 = 0;

			// ----------------------------------------------
			// START MOMENTUM SCROLLING IF CONDITIONS ARE MET
			// ----------------------------------------------

			if (
			  self.velocityThreshold < Math.abs(velocity) &&
			  self.sensitivityThreshold < magnitude
			) {
				// If there's already a renderer, expire it to stop it.
				this.renderer.isExpired = true;

				// touchstart init stuff
				var now = Date.now();
				var beginningVal = 0;
				var changeVal = velocity * 1000;
				var durationVal = 1000;

				// Make a new context because I don't want to mix UIEvents with animations
				// in the same calling context.
				var animationContext = {
					t0 : now,
					y0 : 0,
					dy : 0,
					isScrolling: true,
					renderer : null
				};

				// make a renderer  ...
				this.renderer = new Renderer(function (t) {
					var val = self.timingFunction(t-now, beginningVal, changeVal, durationVal);
					//console.debug('v='+velocity, 'mag='+magnitude, 'change='+changeVal, 'val='+val);
					onTouchMove.call(animationContext, val);
				}, durationVal);
				animationContext.renderer = this.renderer;
				self.addRenderer(this.renderer); // ... and put it in the render container
			}
		}

	}


	/**
	 * Move data from the dataset to the View Holders.
	 */
	shift () {
		var c;
		for ( var i=0; i<this.containers.length; ++i ) {
			if ( ! this.dataset[this.offset + i] ) continue; // prevent boundary error
			c = this.containers[i];
			if ( c.firstChild ) c.removeChild(c.firstChild);
			c.appendChild(this.dataset[this.offset + i]);
		}
	}


	/**
	 * @todo Right now, this is called by the user after this.el is on the live DOM tree.
	 *       make this an internally called function and provide an `initialize` method to the user.
	 * @description
	 * Clear out all containers. Insert a single container and measure it's height vs this.el's height.
	 * Append additional containers until the viewing area is covered by containers.
	 */
	initialize () {
		this.clear();
		var rect = this.node.getBoundingClientRect();
		var computedStyle = getComputedStyle( this.node );
		var scrollViewPadding = parseInt( computedStyle.padding );
		var borderHeight = parseInt( computedStyle.borderBottomWidth ) + parseInt( computedStyle.borderTopWidth );
		var scrollViewHeight = Math.ceil( rect.bottom - rect.top ) - scrollViewPadding - borderHeight;

		this.node.appendChild( new Adapter.ViewHolder().node );
		var liveTemplate = this.node.querySelector(':first-child');

		rect = liveTemplate.getBoundingClientRect();
		var dy = Math.ceil( rect.bottom - rect.top );
		this.containerTemplateHeight = dy;

		this.clear();
		// if y*dy == scrollViewHeight, then we need AT LEAST y sub adapter items to fill the view.

		var y = Math.ceil( scrollViewHeight / dy );
		this.viewableTemplates = y;

		var bufferRoom = 2; // TODO: testing extra containers

		for ( var i=0; i<y + bufferRoom; ++i ) {
			var container = new Adapter.ViewHolder().node;
			this.node.appendChild(container);
			this.containers.push(container);
		}

		this.refresh();
		this.render();
	}


	/**
	 * Put some dataset elements into view template containers.
	 */
	render () {
		var c;
		for (var i=0; i<this.viewableTemplates; ++i) {
			c = this.containers[i];
			if ( c.firstChild ) c.removeChild(c.firstChild);
			c.appendChild(this.dataset[i+this.offset]);
		}
	}


	/**
	 * Remove the container DOM elements.
	 */
	clear () {
		while ( this.node.lastChild ) {
			this.node.removeChild(this.node.lastChild);
		}
		while ( this.containers.length ) {
			this.containers.pop();
		}
	}


	/**
	 * Set the transforms of the container elements so they line up properly.
	 */
	refresh () {
		for ( var i=0; i<this.containers.length; ++i ) {
			this.containers[i].style.transform = 'translate3d(0,'+((i-1)*this.containerTemplateHeight)+'px,0)';
		}
	}


}




module.exports = ScrollView;


},{"./Adapter":1,"./Base":2,"./Renderer":3}],5:[function(require,module,exports){
'use strict';

function div () {
	return document.createElement('div');
}


class ViewHolder {

	constructor () {
		this.node = div();
		this.node.classList.add('scrollview-element');
		var rect = this.measureNode();
		this.height = rect.bottom - rect.top;
	}


	measureNode () {
		var parent = div();
		var child = this.node.cloneNode(true);

		child.style.width='100px';
		child.style.height='300px';
		parent.style.position='absolute';
		parent.style.visiblity='hidden';
		parent.style.pointerEvents='none';

		document.body.appendChild( parent );
		parent.appendChild( child );
		var rect = child.getBoundingClientRect();

		document.body.removeChild( parent );

		return rect; 
	}


}

ViewHolder.measure = function () {
};

module.exports = ViewHolder;

},{}],6:[function(require,module,exports){
'use strict';

var _FPS = 120;
var _lastT = 0;
var _renderables = new Map();
var _dT = 1000 / _FPS;

var _expiredQueue = [ ];

requestAnimationFrame(update);

function update (t) {
	if ( t - _lastT > _dT ) {
		_lastT = t;
		var now = Date.now();
		var it = _renderables.entries();

		for ( var pair of _renderables.entries() ) {
			if ( pair[1].isExpired ) {
				_expiredQueue.push(pair[0]);
				continue;
			}
			pair[1].render(now);
		}
		while ( _expiredQueue.length ) {
			_renderables.delete(_expiredQueue[0]);
			_expiredQueue.shift();
		}

	}
	requestAnimationFrame(update);
}



module.exports = {
	renderables : _renderables
};

},{}],7:[function(require,module,exports){
var ScrollView = require('../src/js/ScrollView');

if ( document.readyState === 'complete' || document.readyState === 'interactive' ) {
	main()
} else {
	document.addEventListener('DOMContentLoaded', main);
}


var scrollview;

function main () {
	
	window.scrollview = 
	scrollview = new ScrollView();

	document.body.querySelector('#test-box').appendChild(scrollview.node);

	scrollview.dataset.push( document.createElement('div') );

	var i=1001;
	while ( i-- ) {
		var el = document.createElement('div');
		el.innerHTML = i;
		el.onclick = clicker;
		scrollview.dataset.push(el);
	}

	scrollview.initialize();

	function clicker (e) {
		console.debug(this.innerHTML);
	}

	bindEvents();
}


function bindEvents () {
	var controlls = Array.prototype.slice.call(document.querySelectorAll('.controlls'), 0);
	var setHeight = document.getElementById('set-height');
	var height = document.getElementById('height');
	setHeight.onclick = function () {
		scrollview.node.style.height = height.value + 'px';	
		scrollview.initialize();
	};

	var controllToggle = document.getElementById('controll-toggle');
	var controllsActive = false;

	controllToggle.onclick = function () {
		controlls.forEach(function (node) {
			node.classList.remove('hidden');
			controllToggle.classList.remove('active');
			controllsActive = ! controllsActive;
			if ( ! controllsActive ) {
				node.classList.add('hidden');
			} else {
				controllToggle.classList.add('active');
			}
		});
	};
}

},{"../src/js/ScrollView":4}]},{},[7,1,2,3,4,5,6]);
