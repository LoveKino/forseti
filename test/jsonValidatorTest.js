var jsonValidator = require("../lib/forseti.js");
var assert = require("assert");

var m1 = jsonValidator.createMarker(true);
var markedSample1 = {
	name: m1.um("ddchen"),
	hobitts: [{
		level: m1.ian(5)
	}],
	next: m1.iaa([])
}

it('should pass for a correct result', function() {
	var result = jsonValidator.validate({
		name: "ddchen",
		phone: "12345678",
		age: 25,
		address: "not telling you",
		hobitts: [{
			type: "sleep",
			level: 5
		}],
		next: []
	}, markedSample1);
	console.log(JSON.stringify(result));
	assert.equal(result.pass, true);
});

it('should fail for missing unmissing name', function() {
	var result = jsonValidator.validate({
		phone: "12345678",
		hobitts: [{
			type: "sleep",
			level: 5
		}],
		next: []
	}, markedSample1);
	console.log(JSON.stringify(result));
	assert.equal(result.pass, false);
	assert.equal(result.failInfo.position.propName, "name");
});

it('should fail for level is not a number', function() {
	var result = jsonValidator.validate({
		name: "ddchen",
		phone: "12345678",
		hobitts: [{
			type: "sleep",
			level: "5"
		}],
		next: []
	}, markedSample1);
	console.log(JSON.stringify(result));
	assert.equal(result.pass, false);
	assert.equal(result.failInfo.position.propName, "level");
});

it('should fail for next is not a array', function() {
	var result = jsonValidator.validate({
		name: "ddchen",
		phone: "12345678",
		hobitts: [{
			type: "sleep",
			level: 5
		}],
		next: 234
	}, markedSample1);
	console.log(JSON.stringify(result));
	assert.equal(result.pass, false);
	assert.equal(result.failInfo.position.propName, "next");
});

it('should "is not a array" plugin works', function() {
	jsonValidator.registerMarkerType("inaa", {
		check: function(json, propName) {
			var attrValue = json[propName];
			return !Array.isArray(attrValue);
		}
	});

	var m2 = jsonValidator.createMarker(true);
	var markedSample2 = {
		name: m2.inaa("ddchen")
	};
	(function() {
		var result = jsonValidator.validate({
			name: []
		}, markedSample2);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, false);
		assert.equal(result.failInfo.position.propName, "name");
	})();
	(function() {
		var result = jsonValidator.validate({
			name: "3243"
		}, markedSample2);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, true);
	})();
});

it('should work for instance level plugin', function() {
	var m2 = jsonValidator.createMarker(true);
	m2.addRule("inab", {
		check: function(json, propName, extra) {
			var value = json[propName];
			return !(value === false || value === true);
		}
	});
	var markedSample2 = {
		name: m2.inab("ddchen")
	};
	(function() {
		var result = jsonValidator.validate({
			name: false
		}, markedSample2);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, false);
		assert.equal(result.failInfo.position.propName, "name");
	})();
	(function() {
		var result = jsonValidator.validate({
			name: "3243"
		}, markedSample2);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, true);
	})();
});

it('should work when nest rules', function() {
	var m3 = jsonValidator.createMarker(true);
	var markedSample3 = {
		name: m3.um(m3.inan("ddchen"))
	};
	(function() {
		var result = jsonValidator.validate({
			name: 123
		}, markedSample3);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, false);
		assert.equal(result.failInfo.position.propName, "name");
	})();
	(function() {
		var result = jsonValidator.validate({}, markedSample3);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, false);
		assert.equal(result.failInfo.position.propName, "name");
	})();
	(function() {
		var result = jsonValidator.validate({
			name: "dsa"
		}, markedSample3);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, true);
	})();
});

it('should work when has extra value', function() {
	var m4 = jsonValidator.createMarker(true);
	var markedSample4 = {
		name: m4.im("123456", /^\d*$/)
	};
	(function() {
		var result = jsonValidator.validate({
			name: 1323223
		}, markedSample4);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, true);
	})();
	(function() {
		var result = jsonValidator.validate({
			name: {
				a: 1
			}
		}, markedSample4);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, false);
		assert.equal(result.failInfo.position.propName, "name");
	})();
});

it('should work for "ioo" plugin', function() {
	var m5 = jsonValidator.createMarker(true);
	var markedSample5 = {
		name: m5.ioo(1, [1, 2, 3])
	};
	(function() {
		var result = jsonValidator.validate({
			name: 2
		}, markedSample5);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, true);
	})();
	(function() {
		var result = jsonValidator.validate({
			name: 4
		}, markedSample5);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, false);
		assert.equal(result.failInfo.position.propName, "name");
	})();
});


it('should work for repeat key object', function() {
	var m = jsonValidator.createMarker(true);
	var markedSample = {
		"ddchen": m.rpk({
			age: m.um(25)
		})
	};

	(function() {
		var result = jsonValidator.validate({
			"haa": {
				age: 323
			},
			"dssahaa": {
				age: 43
			}
		}, markedSample);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, true);
	})();

	(function() {
		var result = jsonValidator.validate({
			"haa": {},
			"dssahaa": {
				age: 43
			}
		}, markedSample);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, false);
	})();
});

it('should work for repeat key object(2)', function() {
	var m = jsonValidator.createMarker(true);
	var markedSample = {
		"ddchen": m.rpk(m.inan("what"))
	};

	(function() {
		var result = jsonValidator.validate({
			"haa": "dqwew",
			"dssahaa": "dssahaa"
		}, markedSample);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, true);
	})();

	(function() {
		var result = jsonValidator.validate({
			"haa": 50
		}, markedSample);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, false);
	})();
});

it('should work for plain list', function() {
	var m = jsonValidator.createMarker(true);
	var markedSample = [
		m.ian("")
	];

	(function() {
		var result = jsonValidator.validate([1, 2, 3, 4], markedSample);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, true);
	})();

	(function() {
		var result = jsonValidator.validate(["1", "2"], markedSample);
		console.log(JSON.stringify(result));
		assert.equal(result.pass, false);
	})();
});