# D3.js-Collapsible-Tree
Just a simple derived D3.js Collapsible Tree library. This script enables developers to instantiate one or more tree's capable of performing the following operations:
* Generate / Destroy Tree;
* Style some **SVG** elements through **CSS**;
* Enable Zoom;
* Node Selection;
* Node click Callbacks;
* Lazy Loading (**Ajax** requets);
* Two kinds of Node toggling;

This was used as a module for a web App on a personal project. Feel free to use / study / change / contribute :)
*Tested in Chrome and IE(v11) browsers.*

**Disclaimer:** This is a D3-based library. I do not own or have any affliation with D3.js, nor do I intend to promote any material for any personal cause / benefit.

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

### Quick Guide through

Declare a var of a *d3_tree_object* type:

```
var d3_tree = new d3_tree_object();
```

Assign an input object with the following properties:

```
var input = 
						{
							targetDiv:     "#d3_tree_container",  //div where SVG will be appended to (REQUIRED)
							jsonObject:    obj,										//tree JSON (REQUIRED)
							clickCallBack: get_child_data,				//if desired assign a call back for the nodes
							levelWidth:    200,										//the level width between parent and children nodes (px)
							toggleMode:    1,											//0: normal behaviour, 1: force collapse & unload if node of same level opened
							zoom:          true                   //assign pan & zoom within the SVG
						};
```
And *generate* tree:

```
d3_tree.generate(input);
```

Only the properties marked as **Required** are, as stated, required to create the tree SVG.
The ```jsonObject``` has to have the following structure:
```
{
 "name": "flare", //ui title
 "children":      //array of objects (if has any children)
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
Of course further properties can be assigned if needed.

Nevertheless there are a number of extra parameters that can be assigned (to be explained).

## Dependencies

* [D3.js](https://github.com/d3/d3/releases/tag/v3.5.17) - ```v3.5.x```
* [jQuery](https://jquery.com/download/) - ```v3.2.x``` (only used for Ajax requests & promises)

*OBS:* Or simply use the libraries inside the lib folder in the repo.