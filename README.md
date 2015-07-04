forseti
===================================
A new way to validate a json format data.

What is json format data validation?
-----------------------------------
Assume there is a json type data, I do not know it's correct or not. So I will validate this json.
For example, I get two json fomat data:
```
A:{
	"name": "ddchen",
	"age": 25
}
```
and 
```
B:{
	"name": "ddchen",
	"age": "25"
}
```
I got a rule that age must be a number, so json A is right and json B is wrong.
This kind of procedure is json format data validation, we make a judgment that which json is right and which is wrong.

In this example, A and B are source json. "age must be a number" is a validation rule. Validation rules is a group of validation rule. Because A satisfy validation rules, so A is right. B do not satisfy one of validation rules, so B is wrong.

How does forseti deal with validation?
-----------------------------------
It looks like this:
```
var jsonValidator = require("forseti");

var sourceJson = {
	name: "ddchen",
	phone: "12345678",
	hobitts: [{
		type: "sleep",
		level: 5
	}],
	next: []
}

var m = jsonValidator.createMarker(true);
var sample = {
	name: m.um("ddchen"),
	hobitts: [{
		level: m.ian(5)
	}],
	next: m.iaa([])
}

var result = jsonValidator.validate(sourceJson, sample);

console.log(result);

// console show:
// {
//    pass: true
// }

```
Let's look at the code line by line.
### import forseti
```
var jsonValidator = require("forseti");
```
Before import forseti, you need to install it.
```
npm install forseti
```
### get source json
```
var sourceJson = {
	name: "ddchen",
	phone: "12345678",
	hobitts: [{
		type: "sleep",
		level: 5
	}],
	next: []
}
```
This is a definition of source json. Actually, you can get source json from any business scenarios like ajax, server layer.
### create a maker
```
var m = jsonValidator.createMarker(true);
```
Maker is a special object which used to flag attribute. When you pass a "ture" to createMarker, you got a working maker.
We will see how to use maker in the next paragraph.
### define sample
```
var sample = {
	name: m.um("ddchen"),
	hobitts: [{
		level: m.ian(5)
	}],
	next: m.iaa([])
}
```
Sample is the key to define validation rules. Sample looks similar to sourceJson, but there are some Differences.
* missing some attributes
* there are some special sentances like 'name: m.um("ddchen")', 'level: m.ian(5)'.<br>

M is a maker we defined in previous sentance. A maker contain a group of functions which you can be used to declare rules.
For example: 
* 'name: m.um("ddchen")' mean attibute name is unmissing. (um is the shortcut of unmissing).
* 'level: m.ian(5)' means attribute level is a number type. (ian is the shortcut of 'is a number').<br>

Right now, we understand that by using function of a maker to wrapper an attribute, we can declare a validtion rule on the attribute.
About maker, you need to know more:
* we already defined a goup of functions.<br>
```
  um                shortcut of ummissing                           eg: m.um(value)
  ian               shortcut of "is a number"                       eg: m.ian(value)
  nu                shortcut of "not null"                          eg: m.nu(value)
  iaa               shortcut of "is a array"                        eg: m.iaa(value)
  inan              shortcut of "is not a number"                   eg: m.inan(value)
  im                shortcut of "is matching"                       eg: m.im(value , regExp) regExp is a regular expression
  ioo               shortcut of "is one of"                         eg: m.ioo(value , list)  list is a array
  rpk               shortcut if "repeated key"                      eg: m.rpk(value) this one is special, see more next.
```
* you can define your own maker function in prototype level or instance level. We will talk about that later.<br>

### validate json
```
var result = jsonValidator.validate(sourceJson, sample);

console.log(result);
```
Sample stands for a group of validation rules. SourceJson is our source data. By call jsonValidator.validate, we get result.
Result is an object which contains attribute pass and other. If pass is true means sourceJson satisfy validation rule. Otherwise, we get failInfo to present failing massage.
For example:<br>
* right situdation
```
{
    pass: true
 }
```
* wrong situation
```
{
	"pass": false,
	"failInfo": {
		"position": { //Where to fail.
			"json": {
				"phone": "12345678",

			},
			"propName ": "name "
		},
		"type ": "um" //Which kind of rule.
	}
}
```

Right now, we know what forseti can do and how to use forseti. Next, we will talk how to expand validation rules.

Expand validation rules
-----------------------------------
Customize maker function in prototype level or instance level.

### Customize maker in instance level
When we get a maker, like that:
```
var m = jsonValidator.createMarker(true);
```
We can expand maker just for m (that's why we call that instance level).
For example:
```
var m = jsonValidator.createMarker(true);
m.addRule("inab", {
	check: function(json, propName, extra) {
		var value = json[propName];
		return !(value === false || value === true);
	}
});

// then we can use that
var markedSample = {
	name: m.inab("ddchen")
};
```
or use a map
```
m.addRuleMap({
	"inab", {
		check: function(json, propName, extra) {
			var value = json[propName];
			return !(value === false || value === true);
		}
	}
});
```

### Customize maker in prototype level
This kind of customization is working for all maker.
For example:
```
jsonValidator.registerMarkerType("um", {
		check: function(json, propName, extra) {
			return json.hasOwnProperty(propName);
		}
	);
```
Or use a map:
```
jsonValidator.registerMarkerMap({
			"um": {
				check: function(json, propName, extra) {
					return json.hasOwnProperty(propName);
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
			});
```

Allow validation rule nest
-----------------------------------
Allow nest like: m.um(m.ian(value)), means value is "um" and "ian".

Support repeated key
-----------------------------------
Let's see an example:
```
A: {
	"ddchen":{
		"age":25
	},
	"kino":{
		"age":24
	},
	"somebody":{
		"age":100
	}
}
```
For this json, pattern is that every attribute of A is an object, and has an attribute of age which is a number. How to describle that kind of validation rule?

Don't worry, we can use "rpk" to mark an attibute to flag that. 
sample: 
```
{
	"rkpName":m.rpk({
		age:m.ian(5)
	})
}
```
