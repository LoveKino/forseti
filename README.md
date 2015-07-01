forseti
===================================
A new way to validate a json format data.

What is json format data validation?
-----------------------------------
Assume there are a json type data, I do not know it's correct or not. So I will validate this json.
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
