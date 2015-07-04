/**
 * json validator
 *
 * @desciption
 *    validator a json data according to your validate rules
 * @author  ddchen
 *
 * allow nest like: maker.um(maker.ian(value))
 */

var CONST = require("./const");
var JsonRegulationMarker = require("./jsonRegulationMarker.js");
var jsonValidator = require("./jsonValidator.js");

var registerMarkerType = function(type, value) {
	JsonRegulationMarker.prototype[type] = function(value, extra) {
		return this.mark(type, value, extra);
	}
	JsonRegulationMarker.prototype[type].rule = value;
}

var registerMarkerMap = function(map) {
	for (var type in map) {
		var value = map[type];
		registerMarkerType(type, value);
	}
}

registerMarkerMap({
	"um": { // shortcut of "unmissing"
		check: function(json, propName, extra) {
			return json.hasOwnProperty(propName);
		}
	},
	"ian": { //shortcut of "is a number"
		check: function(json, propName, extra) {
			var attrValue = json[propName];
			return typeof attrValue === "number"
		}
	},
	"nu": { //shortcut of "not null"
		check: function(json, propName, extra) {
			var attrValue = json[propName];
			return attrValue === null;
		}
	},
	"iaa": { // shortcut of "is a array"
		check: function(json, propName, extra) {
			var attrValue = json[propName];
			return Array.isArray(attrValue);
		}
	},
	"inan": { // shortcut of "is not a number"
		check: function(json, propName, extra) {
			var attrValue = json[propName];
			return !(typeof attrValue === "number")
		}
	},
	"im": { // shortcut of "is matching"
		check: function(json, propName, extra) {
			var attrValue = json[propName];
			if (extra instanceof RegExp) {
				return extra.test(attrValue);
			}
			return false;
		}
	},
	"ioo": { // shortcut of "is one of"
		check: function(json, propName, extra) {
			var attrValue = json[propName];
			if (Array.isArray(extra)) {
				for (var i = 0; i < extra.length; i++) {
					var item = extra[i];
					if (attrValue == item) {
						return true;
					}
				}
			}
			return false;
		}
	},
	"rpk": { // shortcut of "is one of"
		check: function(json, propName, extra) {
			return true;
		}
	}
});

// module compatible
module.exports = {
	createMarker: function(launchFlag) {
		return new JsonRegulationMarker(launchFlag);
	},
	validate: function(json, markedSample) {
		return jsonValidator.validate(json, markedSample);
	},
	registerMarkerType: registerMarkerType,
	registerMarkerMap: registerMarkerMap
};