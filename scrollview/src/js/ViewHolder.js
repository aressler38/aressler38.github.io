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
