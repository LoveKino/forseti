/**
 * json validator
 *
 * @desciption
 *    validator a json data according to your validate rules
 * @author  ddchen
 *
 * allow nest like: maker.um(maker.ian(value))
 */

var jsonValidatorInterface = (function() {
	var MARK_SIGNAL_SYMBOL = "__mark__signal__symbol__";
	var MARK_INSTANCE_QUOTE = "__mark__instance__quote__";
	var MARK_REPEAT_KEY = "__mark_repeat__key__";

	var JsonRegulationMarker = (function() {
		var JsonRegulationMarker = function(launchFlag) {
			this.launchFlag = launchFlag;
		}

		JsonRegulationMarker.prototype.mark = function(type, value, extra) {
			if (this.launchFlag) {
				// support marking nest
				if (typeof value === "object" && value[MARK_SIGNAL_SYMBOL]) {
					value.type = value.type + "&" + type;
					value.extras.push(extra);
				} else {
					var newValue = {
						type: type,
						value: value,
						extras: [extra]
					}
					if (type === "rpk") {
						newValue[MARK_REPEAT_KEY] = true;
					}
					newValue[MARK_SIGNAL_SYMBOL] = true;
					newValue[MARK_INSTANCE_QUOTE] = this;
					value = newValue;
				}
			}
			return value;
		}

		JsonRegulationMarker.prototype.addRule = function(type, rule) {
			this[type] = function(value, extra) {
				return this.mark(type, value, extra);
			}
			this[type].rule = rule;
		}
		JsonRegulationMarker.prototype.addRuleMap = function(map) {
			for (var type in map) {
				var rule = map[type];
				this.addRule(type, rule);
			}
		}
		return JsonRegulationMarker;
	})();

	var jsonValidator = (function() {
		var JsonRegulationValidator = function() {}
		JsonRegulationValidator.prototype = {
			validate: function(json, markedSample) {
				if (this._isNormal(markedSample)) {
					return {
						pass: true
					};
				}
				if (Array.isArray(markedSample)) {
					return this._validateArrSample(json, markedSample);
				} else if (typeof markedSample === "object") {
					return this._validateObjSample(json, markedSample);
				}
			},
			_validateArrSample: function(json, markedSample) {
				if (!Array.isArray(json)) {
					return {
						pass: true
					};
				} else {
					var childSample = markedSample[0];
					for (var i = 0; i < json.length; i++) {
						var childJson = json[i];
						var childResult = this.validate(childJson, childSample);
						if (!childResult.pass) {
							return childResult;
						}
					}
					return {
						pass: true
					};
				}
			},
			_validateObjSample: function(json, markedSample) {
				if (typeof json !== "object") {
					return {
						pass: true
					};
				}
				for (var propName in markedSample) {
					var markAttr = markedSample[propName];
					if (this._isRepeatValue(markAttr)) {
						return this._validateRepeatKey(json, markAttr);
					}
					if (this._isMarkedValue(markAttr)) {
						var checkResult = this._check(json, markedSample, propName);
						if (!checkResult.pass) {
							return checkResult;
						}
					}
					var childResult = this.validate(json[propName], this._getAttrValue(markAttr));
					if (!childResult.pass) {
						return childResult;
					}
				}
				return {
					pass: true
				};
			},
			_validateRepeatKey: function(json, markAttr) {
				for (var jsonPropName in json) {
					var childJson = json[jsonPropName];
					var childResult = this.validate(childJson,
						this._getAttrValue(markAttr));
					if (!childResult.pass) {
						return childResult;
					}
				}
				return {
					pass: true
				}
			},
			_getAttrValue: function(attr) {
				if (this._isMarkedValue(attr)) {
					return attr.value;
				}
				return attr;
			},
			_check: function(json, markedSample, propName) {
				var attr = markedSample[propName];
				// find rule to check
				var type = attr.type;
				var maker = attr[MARK_INSTANCE_QUOTE];
				var types = type.split("&");
				for (var i = 0; i < types.length; i++) {
					var typeElem = types[i];
					var extra = attr.extras[i];
					var rule = maker[typeElem].rule;
					var pass = rule.check(json, propName, extra);
					if (!pass) {
						return {
							pass: false,
							failInfo: {
								position: {
									json: json,
									markedSample: markedSample,
									propName: propName
								},
								type: typeElem
							}
						}
					}
				}
				return {
					pass: true
				}
			},
			_isMarkedValue: function(value) {
				return (typeof value === "object" && value[MARK_SIGNAL_SYMBOL]);
			},
			_isRepeatValue: function(value) {
				return (typeof value === "object" && value[MARK_REPEAT_KEY]);
			},
			_isNormal: function(data) {
				if (data === null || data === undefined) return true;
				if (typeof data === "string") return true;
				if (typeof data === "number") return true;
				if (typeof data === "boolean") return true;
				return false;
			}
		}

		var jsonValidator = new JsonRegulationValidator();
		return jsonValidator;
	})();

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

	return {
		createMarker: function(launchFlag) {
			return new JsonRegulationMarker(launchFlag);
		},
		validate: function(json, markedSample) {
			return jsonValidator.validate(json, markedSample);
		},
		registerMarkerType: registerMarkerType,
		registerMarkerMap: registerMarkerMap
	};
})();

// module compatible
if (typeof module === "object" && typeof module.exports === "object") {
	module.exports = jsonValidatorInterface;
}