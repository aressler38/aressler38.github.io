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

