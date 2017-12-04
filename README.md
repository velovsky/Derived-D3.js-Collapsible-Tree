# D3.js-Collapsible-Tree
Just a simple derived D3.js Collapsible Tree library. This script enables developers to instantiate one or more tree's capable of performing the following operations:

* Generate / Destroy Tree;
* Style some **SVG** elements through **CSS**;
* Enable Zoom;
* Node Selection;
* Node click Callbacks;
* Lazy Loading (**Ajax** request);
* Two kinds of Node toggling;

**Motivation**: This was used in a personal project as a module for a web App. I felt that the original D3 tree could be more JS-friendly and customizable. Feel free to use / study / change / contribute and criticize :).

*Tested in Chrome and IE(v11) browsers.*

**Disclaimer:** This is a D3-based library. I do not own or have any affiliation with D3.js, nor do I intend to promote any material for any personal cause / benefit.

### Example

[Here](https://rawgit.com/velovsky/Derived-D3.js-Collapsible-Tree/master/src/test.html) you have a live preview of a D3 tree performing lazy loadings on click.
It is also possible to define different configurations.

## Installing

Simply download the src files and add the "tree.js" to your html file:

```
<script src="...src/js/tree.js" charset="utf-8"></script> 
```

And the "tree.css" file:
```
<link rel="stylesheet" href="...src/css/tree.css">
```

### Quick guide through

Declare a variable of a ```d3_tree_object``` type:

```
var d3_tree = new d3_tree_object();
```

Assign an input object with the following properties (example):

```
var input = 
{
	targetDiv:     "#d3_tree_container",
	jsonObject:    obj,									
	clickCallBack: get_child_data,				
	levelWidth:    200,										
	toggleMode:    1,											
	zoom:          true                   
};
```
And *generate* the tree:

```
d3_tree.generate(input);
```

The ```targetDiv``` and ```jsonObject``` properties are required to be assigned for the ```input``` object. If not, a console error will be generated. ```targetDiv``` is the *div* where the **SVG** shall be appended to, and ```jsonObject``` is the *data* that feeds the tree (or initial hard-coded Data). The following properties (clickCallBack, levelWidth, ...) are not required to be inputted, nevertheless they are helpful if a more "custom-tailored" tree is desired.

**clickCallBack:** Callback used for node ```onclick``` events. For example, it might be useful for Lazy Loading requests or any additional tasks.

**levelWidth:** Define the width in *px* between parent and children nodes. Default is 180(px).

**toggleMode:** Defines the behaviour when toggling the nodes in the tree. Two integers are accepted: 

* ```0```: default behaviour; 
* ```1```: when a node is clicked all its siblings are forced to collapse and unload data (only works for Lazy Loading design patterns). 

Default is ```0```.

**zoom:** Boolean value. If ```true``` the tree's SVG can be panned and zoomed. Default is ```false```.

**duration:** The transition duration in ms. Default is 750(ms).


The ```jsonObject``` property has to have the following structure:
```
{
 "name": "flare",   //ui title
 "children":        //array of objects (if it has any children)
	[{    
	 "name": "analytics",
	 "children": [] 
		},
	{
	 "name": "analytics",
	 "children": []
	 }]
}
```

Of course, additional properties can be assigned if needed.

### Lazy Loading example

Bellow is an example of a lazy loading callback. The way the API is built, requires to be returned a (**jQuery**) promise in order to correctly toggle the nodes. This behavior might be improved in order to avoid **jQuery** dependencies in the future.
```
function get_child_data(d)
	{		
		if(d.loaded !== undefined)
			return;

		var newItem = [];

		var promise = $.ajax({
			url: "https://jsonplaceholder.typicode.com/posts?userId=" + d.key, //get childs of parent with certain key (or any other property)
			dataType: 'json',
			type: 'GET',
			cache: false,
			success: function(responseJson)
			{
				if(responseJson.length === 0)
					return;

				var temp = responseJson;

				temp.forEach(function(element)
						{
							var buffer = {};
							buffer["name"] = element["title"];
							buffer["key"] = element["id"];
							buffer["body"] = element["body"];
							buffer["_children"] = [];          //add this if there are more childs to spawn

							newItem.push(buffer);
						});

				if(d.children)
					d.children = newItem;
				else
					d._children = newItem;

				d.loaded = true; //let D3 know if node childs have been loaded
			}
		});

		return promise; //return a promise if async. requests
					
	}
```
Firstly define a ```loaded``` property (could be another)  in order to avoid unnecessary requests and tree reloading's, if children are already loaded.
```
if(d.loaded !== undefined)
			return;
```
Make a request for the info that you want to display. In this case I am using ```key``` property of the initial loaded json as a criteria to get the childs.
```
var promise = $.ajax({
            url: "https://jsonplaceholder.typicode.com/posts?userId=" + d.key, //get childs of parent with certain key (or any other property)
```
Once the request has been completed, append the new child's object to the parent's object.  A ```children``` property means that child nodes are visible, while a ```_children``` denotes a collapsed node.
```
if(d.children)
	d.children = newItem;
else
	d._children = newItem;
```
Lastly define ```loaded``` as true to avoid further requests, and return the **promise** of the request.
```
	d.loaded = true; //let D3 know if node childs have been loaded
	}
});

return promise; //return a promise if async. requests		
```
This is a custom way of performing lazy loading. You can assign a different design pattern as long as you follow the same principles as the one in the example. 
If you still have doubts just check the code on the preview example.

**OBS:** When defining the initial json don't forget to define the root node ```loaded``` to true.

## Dependencies

* [D3.js](https://github.com/d3/d3/releases/tag/v3.5.17) - ```v3.5.x```
* [jQuery](https://jquery.com/download/) - ```v3.2.x``` (only used for Ajax requests & promises)

*OBS:* These modules can be found inside the lib folder in the repository.