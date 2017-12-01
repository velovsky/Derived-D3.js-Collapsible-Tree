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

A live preview shall be provided.

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

## Dependencies

* [D3.js](https://github.com/d3/d3/releases/tag/v3.5.17) - ```v3.5.x```
* [jQuery](https://jquery.com/download/) - ```v3.2.x``` (only used for Ajax requests & promises)

*OBS:* These modules can be found inside the lib folder in the repository.