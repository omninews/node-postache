const assert = require('assert');
const postache = require('../index.js');


describe("text", () => {
	it("should crash if no database was given", () => {
		assert.throws(
			() => postache([], [], "postgres://some.url"), 
			Error, 
			"Invalid database URL!"
		);
	});

	it("should not crash if no auth was given", (done) => {
		postache([], [], "postgres://some.url/omni"), 
		done()
	});

	it("should not crash if only username was given", (done) => {
		postache([], [], "postgres://username@some.url/omni"); 
		done();
	});

	it("should not crash if auth was given", (done) => {
		postache([], [], "postgres://username:password@some.url/omni"); 
		done();
	});
});