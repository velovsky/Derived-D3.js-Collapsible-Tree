/**
 * @summary     D3.js collapsible Tree
 * @description D3.js tree class object
 * @version     0.0 / D3 v3.x / (requires jQuery)
 * @file        tree.js
 * @author      Tiago Câmara
 * @copyright   N/A
 *
 */

function d3_tree_object()
{
	//internal
	this.increment();
	this._number = this.static.count;
	
	//properties
	this.svg;
	this.margin;

	//methods
	this.generate = function(input)
	{
		//on generate, destroy old tree
		this.destroy();
				
		//Process input
		if( input.targetDiv === undefined ||  input.jsonObject === undefined )
			return console.error("bad input");
		
		var targetObj = input.targetDiv;
		var jsonObj = input.jsonObject;
		var clickCallBack = input.clickCallBack;
		var text_width = input.levelWidth !== undefined ? input.levelWidth : 180;
		var zoomable = input.zoom !== undefined ? input.zoom : false;
		//0: normal behaviour, 1: force collapse 
		var toggle_mode = input.toggleMode !== undefined ? input.toggleMode : 0;
		var duration = input.duration !== undefined ? input.duration : 750;
		
		//DOM to be manipulated
		var targetDom = d3.select(targetObj).node();
		
		var margin = {top: 10, right: 120, bottom: 20, left: 120},
	    width = targetDom.clientWidth - margin.right - margin.left,
	    height = targetDom.clientHeight - margin.top - margin.bottom;
		
		this.margin = margin;

		var i = 0,
		text_width_ratio = 220/31, //220 width for 31 chars
		root;
		
		var tree = d3.layout.tree()
		.size([height, width]);

		var diagonal = d3.svg.diagonal()
		.projection(function(d) { return [d.y, d.x]; });
		
		//Append to Container
		var svg = d3.select(targetObj)
		.append("svg")
		.attr("width", "100%")
		.attr("height", "100%")
		.append("g")
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
		this.svg = d3.select(targetObj + " svg").node();
		this.svg["toggle_mode"] = toggle_mode; //additional info
		
		//if Zoomable
		if(zoomable)
			this.enableZoom();
			
		//Read JSON and populate D3 tree
		root = jsonObj;
		root.x0 = height / 2;
		root.y0 = 0;

		function collapse(d) {
			if (d.children) {
				d._children = d.children;
				d._children.forEach(collapse);
				d.children = null;
			}
		}

		root.children.forEach(collapse);
		update(root);

		d3.select(self.frameElement).style("height", "800px");
	
		function update(source) {

			// Compute the new tree layout.
			var nodes = tree.nodes(root).reverse(),
			links = tree.links(nodes);

			
			// Normalize for fixed-depth.
			nodes.forEach(function(d) { d.y = d.depth * text_width; });

			// Update the nodes…
			var node = svg.selectAll("g.node")
			.data(nodes, function(d) { return d.id || (d.id = ++i); });

			// Enter any new nodes at the parent's previous position.
			var nodeEnter = node.enter().append("g")
			.attr("class", "node")
			.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; });

			nodeEnter.append("circle")
			.attr("r", 1e-6)
			.classed("closed", function(d) { return d._children })
			.on("click", function(d) 
						{ 	
							var circle = d3.select(this);
							//for async CallBacks
							if(clickCallBack !== undefined)
							{
								var promise = clickCallBack(d);
								if(promise !== undefined) circle.classed("spinner",true);
							}
								
							//unload & collapse node (if toggle_mode === 1 && same depth)
							var svg_dom = this.ownerSVGElement;
							if(svg_dom.toggle_mode === 1) collapse_unload(d,svg_dom);
							
							promise !== undefined ? $.when(promise).done(function(){ circle.classed("spinner",false); toggle(d); }.bind(this)) : toggle(d);
						});
			
			nodeEnter.append("text")
			.attr("x", function(d) { return d.parent === undefined ? -10 : 10; })
			.attr("dy", ".35em")
			.attr("text-anchor", function(d) { return d.parent === undefined ? "end" : "start";	})
			.text(function(d) { return d.name; })
			.style("fill-opacity", 1e-6);
			
			nodeEnter.append("rect")
			.style("fill-opacity", 0)
			//.classed("rectClass",true)
			.attr("x", function(d) { return d.parent === undefined ? -this.parentNode.getBBox().width - 6 : 6;	})
			.attr("rx", 6)
			.attr("y", -6)
			.attr("width", function(d) { return this.parentNode.getBBox().width; })
			.attr("height", function(d) { return this.parentNode.getBBox().height; })
			.on("click", function(d)
						 {
							//get clicked svg
							var svg_dom = this.ownerSVGElement;
							
							//remove selected (if any)
							d3.select(svg_dom).selectAll(".node text.selected")
							.classed("selected",false);
							
							d3.select(svg_dom).selectAll(".node rect.selected")
							.classed("selected",false)
							.style("fill-opacity",0);
							
							//assign new text & rect selected
							d3.select(this.parentNode)
							.select("text")
							.classed("selected",true);
							
							d3.select(this)
							.style("fill-opacity",null)
							.classed("selected",true);
							
						 });
			
			// Transition nodes to their new position.
			var nodeUpdate = node.transition()
			.duration(duration)
			.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

			nodeUpdate.select("circle")
			.attr("r", 4.5);
			
			nodeUpdate.select("circle")[0]
			.forEach(function(element)
					{
						if(element === null || element.parentNode === undefined)
							return;
							
						var d = d3.select(element.parentNode).data()[0];
						var circle = d3.select(element);
						d._children ? circle.classed("closed",true) : circle.classed("closed",false);
					});

			nodeUpdate.select("text")
			.style("fill-opacity", 1);

			// Transition exiting nodes to the parent's new position.
			var nodeExit = node.exit().transition()
			.duration(duration)
			.attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
			.remove();

			nodeExit.select("circle")
			.attr("r", 1e-6);

			nodeExit.select("text")
			.style("fill-opacity", 1e-6);

			// Update the links…
			var link = svg.selectAll("path.link")
			.data(links, function(d) { return d.target.id; });

			// Enter any new links at the parent's previous position.
			link.enter().insert("path", "g")
			.attr("class", "link")
			.attr("d", function(d) 
			{
				var o = {x: source.x0, y: source.y0};
				return diagonal({source: o, target: o});
			});

			// Transition links to their new position.
			link.transition()
			.duration(duration)
			.attr("d", diagonal);

			// Transition exiting nodes to the parent's new position.
			link.exit().transition()
			.duration(duration)
			.attr("d", function(d) 
			{
				var o = {x: source.x, y: source.y};
				return diagonal({source: o, target: o});
			})
			.remove();

			// Stash the old positions for transition.
			nodes.forEach(function(d) {
				d.x0 = d.x;
				d.y0 = d.y;
			});
		}
		
		// Toggle Mode = 1: force unload & collapse node
		function collapse_unload(d,svg_dom)
		{

			//get all nodes
			var nodes = d3.select(svg_dom).selectAll("g.node").data();
			var idx = nodes.findIndex( //find node that is already opened
					function(element)
					{
						return ( element.depth === d.depth && element.children &&
								element.id !== d.id )
					});
			
			if(idx !== -1)
			{				
				toggle(nodes[idx]);
				
				delete nodes[idx].children;
				delete nodes[idx].loaded;
			}
		}
		
		//	Toggle children on click.
		function toggle(d) 
		{
			if (d.children) 
			{
				d._children = d.children;
				d.children = null;
			} 
			else 
			{
				d.children = d._children;
				d._children = null;
			}
			update(d);
		}

	},
	this.getActiveNode = function()
	{
		if(this.svg === undefined)
			return;
		
		var node = d3.select(this.svg)
		.select(".node text.selected")
		.node();
		
		if(node === null)
			return;
		
		node = node.parentNode;
		
		return d3.select(node).data();
	},
	this.enableZoom = function()
	{
		d3.select(this.svg)
		.classed("grabbaable",true)
		.call(d3.behavior.zoom()
			.scaleExtent([0.5,50])
			.on("zoom", function () 
			{
				d3.select(this)
				.select("g")
				.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
			}));
	},
	this.destroy = function()
	{
		if(this.svg === undefined)
			return;
				
		d3.select(this.svg)
		.remove();
		
		delete this.svg;
	}
}

d3_tree_object.prototype = 
{
	constructor: d3_tree_object, 
	static: { count: 0 }, 
	increment: function()
	{ 
		this.static.count++; 
	} 
}; 

//Polyfill (for IE versions)
if (!Array.prototype.findIndex) 
{
	Object.defineProperty(Array.prototype, 'findIndex', {
		value: function(predicate) {
			// 1. Let O be ? ToObject(this value).
			if (this == null) {
				throw new TypeError('"this" is null or not defined');
			}

			var o = Object(this);

			// 2. Let len be ? ToLength(? Get(O, "length")).
			var len = o.length >>> 0;

			// 3. If IsCallable(predicate) is false, throw a TypeError exception.
			if (typeof predicate !== 'function') {
				throw new TypeError('predicate must be a function');
			}

			// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
			var thisArg = arguments[1];

			// 5. Let k be 0.
			var k = 0;

			// 6. Repeat, while k < len
			while (k < len) {
				// a. Let Pk be ! ToString(k).
				// b. Let kValue be ? Get(O, Pk).
				// c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
				// d. If testResult is true, return k.
				var kValue = o[k];
				if (predicate.call(thisArg, kValue, k, o)) {
					return k;
				}
				// e. Increase k by 1.
				k++;
			}

			// 7. Return -1.
			return -1;
		}
	});
}