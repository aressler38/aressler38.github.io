
module.exports = UrlParametersTest;

var urlParameters = require('../src/js/urlParameters');


class UrlParametersTest extends UnitTest {

	// I should be able to set some url parameters and get them as an object.
	// test `getParams()`
	super.test(function () {
		var to = new Date(datetimeInterval.time.to);
		var from = new Date(datetimeInterval.time.from);
		history.replaceState(null, null, '?from='+from.toISOString()+'&to='+to.toISOString());

		var params = urlParameters.getParams();
		// not undefined
		expect( params.to !== undefined ).toBe(true);
		expect( params.from !== undefined ).toBe(true);
		// and set properly
		expect( params.to === to.toISOString() ).toBe(true);
		expect( params.from === from.toISOString() ).toBe(true);
	});	


}
