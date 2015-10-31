
module.exports = DatetimeIntervalTest;

var options = require('../src/js/options');


class OptionsTest extends UnitTest {

	// test get returns a view with `selected` property
	super.test(function () {
		expect( options.get(0).selected !== undefined ).toBe(true);
	});

	// I should be able to change the selected property
	super.test(function () {
		options.get(0).selected  = true;
		expect( options.get(0).selected ).toBe(true);
	});

	// I should be able to update certain properties and call the clear method to reset.
	super.test(function () {
		options.get().forEach(function (view) { view.selected = true; });
		options.clear();
		options.get().forEach(function (view) { 
			expect( view.selected ).toBe(false);
		});
	});



}
