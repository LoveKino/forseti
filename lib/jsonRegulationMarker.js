var CONST = require("./const");

var JsonRegulationMarker = function(launchFlag) {
	this.launchFlag = launchFlag;
}

JsonRegulationMarker.prototype.mark = function(type, value, extra) {
	if (this.launchFlag) {
		// support marking nest
		if (typeof value === "object" && value[CONST.MARK_SIGNAL_SYMBOL]) {
			value.type = value.type + "&" + type;
			value.extras.push(extra);
		} else {
			var newValue = {
				type: type,
				value: value,
				extras: [extra]
			}
			newValue[CONST.MARK_SIGNAL_SYMBOL] = true;
			newValue[CONST.MARK_INSTANCE_QUOTE] = this;
			value = newValue;
		}
		if (type === "rpk") {
			value[CONST.MARK_REPEAT_KEY] = true;
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

module.exports = JsonRegulationMarker;
