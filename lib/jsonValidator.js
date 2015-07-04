var CONST = require("./const");

var validate = function(json, markedSample) {
	if (isNormalType(markedSample)) {
		return {
			pass: true
		};
	}
	if (Array.isArray(markedSample)) {
		return validateWithArrSample(json, markedSample);
	} else if (typeof markedSample === "object") {
		return validateWithObjSample(json, markedSample);
	}
	// impossible situation
	return {
		pass: true
	};
}
var validateWithArrSample = function(json, markedSample) {
	if (!Array.isArray(json) || !markedSample.length) {
		return {
			pass: true
		};
	} else {
		var childSample = markedSample[0];
		// check
		for (var i = 0; i < json.length; i++) {
			var checkResult = check(json, i, childSample);
			if (!checkResult.pass) {
				return checkResult;
			}
		}
		// recursion
		for (var i = 0; i < json.length; i++) {
			var childJson = json[i];
			var childResult = validate(childJson, childSample);
			if (!childResult.pass) {
				return childResult;
			}
		}
		return {
			pass: true
		};
	}
}
var validateWithObjSample = function(json, markedSample) {
	if (typeof json !== "object") {
		return {
			pass: true
		};
	}
	for (var propName in markedSample) {
		// marker go down
		var markedValue = markedSample[propName];
		// check prop
		var checkResult = check(json, propName, markedValue);
		if (!checkResult.pass) {
			return checkResult;
		}

		// repeated key
		if (isRepeatValue(markedValue)) {
			return _validateRepeatKey(json, markedValue);
		}
		var childResult = validate(json[propName], getAttrValue(markedValue));
		if (!childResult.pass) {
			return childResult;
		}
	}
	return {
		pass: true
	};
}
var _validateRepeatKey = function(parentJson, markedValue) {
	// check current json's propname
	for (var jsonPropName in parentJson) {
		var checkResult = check(parentJson, jsonPropName, markedValue);
		if (!checkResult.pass) {
			return checkResult;
		}
	}

	// recursion
	for (var jsonPropName in parentJson) {
		var childJson = parentJson[jsonPropName];
		var childResult = validate(childJson,
			getAttrValue(markedValue));
		if (!childResult.pass) {
			return childResult;
		}
	}
	return {
		pass: true
	}
}
var getAttrValue = function(attr) {
	if (isMarkedValue(attr)) {
		return attr.value;
	}
	return attr;
}

var check = function(parentJson, valueName, markedValue) {
	if (isMarkedValue(markedValue)) {
		// find rule to check
		var type = markedValue.type;
		var maker = markedValue[CONST.MARK_INSTANCE_QUOTE];
		var types = type.split("&");
		for (var i = 0; i < types.length; i++) {
			var typeElem = types[i];
			var rule = maker[typeElem].rule;
			var pass = rule.check(parentJson, valueName, markedValue.extras[i]);
			if (!pass) {
				return joinFailInfo(parentJson, markedValue, valueName, typeElem);
			}
		}
	}
	return {
		pass: true
	}
}

var joinFailInfo = function(parentJson, markedValue, propName, typeElem) {
	return {
		pass: false,
		failInfo: {
			position: {
				parentJson: parentJson,
				markedValue: markedValue,
				propName: propName
			},
			type: typeElem
		}
	}
}
var isMarkedValue = function(value) {
	return (typeof value === "object" && value[CONST.MARK_SIGNAL_SYMBOL]);
}
var isRepeatValue = function(value) {
	return (typeof value === "object" && value[CONST.MARK_REPEAT_KEY]);
}
var isNormalType = function(data) {
	if (data === null || data === undefined) return true;
	if (typeof data === "string") return true;
	if (typeof data === "number") return true;
	if (typeof data === "boolean") return true;
	return false;
}

module.exports = {
	validate: validate
}