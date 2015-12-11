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
