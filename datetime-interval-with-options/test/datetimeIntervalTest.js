
module.exports = DatetimeIntervalTest;

var datetimeInterval = require('../src/js/DatetimeInterval');

class DatetimeIntervalTest extends UnitTest {

	// test length() method 
	// I should be able to set the to and from properties and verify the length is correct
	super.test(function () {
		var now = new Date();
		datetimeInterval.time.from = now; 
		datetimeInterval.time.to = new Date(now.getTime() + 100);
		expect( datetimeInterval.time.length() ).toBe(100)
	});


	

}
