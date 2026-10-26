import { hierarchy, tree, type HierarchyNode, type HierarchyPointNode } from "d3-hierarchy";
import { select, type Selection } from "d3-selection";
import { linkHorizontal } from "d3-shape";
import { transition } from "d3-transition";
import { zoom } from "d3-zoom";

/**
 * A node of the input data. A node with `children: []` (an empty array) has children that are
 * not loaded yet: the tree calls `loadChildren` when the user expands it. A node without
 * `children` is a leaf.
 */
export interface TreeDatum {
  name: string;
  children?: TreeDatum[];
}

export interface CollapsibleTreeOptions<T extends TreeDatum> {
  /** The root of the tree. */
  data: T;
  /** Loads the children of a node with `children: []`. Called once per node. */
  loadChildren?: (datum: T) => T[] | Promise<T[]>;
  /** Called when the user selects a node by its label. */
  onSelect?: (datum: T) => void;
  /** Called when `loadChildren` fails. Default: `console.error`. */
  onError?: (error: unknown, datum: T) => void;
  /** The text of a node. Default: `datum.name`. */
  label?: (datum: T) => string;
  /** Horizontal distance between levels, in px. Default: 180. */
  levelWidth?: number;
  /** Vertical distance between rows, in px. Default: 22. */
  rowHeight?: number;
  /** Transition duration, in ms. Default: 750. */
  duration?: number;
  /** Lets the user pan and zoom the tree. Default: false. */
  zoom?: boolean;
  /**
   * When a node opens, close the other open nodes on the same level. Lazily loaded nodes that
   * close this way drop their children, so the next open loads them again. Default: false.
   */
  accordion?: boolean;
}

interface NodeState<T> {
  key: number;
  x0: number;
  y0: number;
  /** All children, visible or not. `children` holds only the visible ones. */
  allChildren?: TreeNode<T>[];
  lazy: boolean;
  loading: boolean;
}

type TreeNode<T> = HierarchyPointNode<T> &
  NodeState<T> & {
    children?: TreeNode<T>[];
    parent: TreeNode<T> | null;
  };

type SvgSelection = Selection<SVGSVGElement, unknown, null, undefined>;
type GroupSelection = Selection<SVGGElement, unknown, null, undefined>;

const MARGIN = { top: 10, right: 120, bottom: 10, left: 120 };

export class CollapsibleTree<T extends TreeDatum> {
  readonly #container: HTMLElement;
  readonly #options: Required<Omit<CollapsibleTreeOptions<T>, "loadChildren" | "onSelect">> &
    Pick<CollapsibleTreeOptions<T>, "loadChildren" | "onSelect">;
  readonly #root: TreeNode<T>;
  readonly #svg: SvgSelection;
  readonly #links: GroupSelection;
  readonly #nodes: GroupSelection;
  #nextId = 0;
  #selected: TreeNode<T> | undefined;

  constructor(container: HTMLElement | string, options: CollapsibleTreeOptions<T>) {
    const element =
      typeof container === "string" ? document.querySelector<HTMLElement>(container) : container;
    if (!element) throw new TypeError(`collapsible-tree: no element found for ${container}`);
    this.#container = element;

    this.#options = {
      levelWidth: 180,
      rowHeight: 22,
      duration: 750,
      zoom: false,
      accordion: false,
      label: (datum) => datum.name,
      onError: (error) => console.error("collapsible-tree: loadChildren failed", error),
      ...options,
    };

    this.#svg = select(this.#container)
      .append("svg")
      .attr("class", "collapsible-tree")
      .attr("role", "tree");
    const canvas = this.#svg.append("g");
    this.#links = canvas.append("g").attr("class", "links");
    this.#nodes = canvas.append("g").attr("class", "nodes");

    if (this.#options.zoom) {
      this.#svg.classed("zoomable", true).call(
        zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.5, 50])
          .on("zoom", (event) => canvas.attr("transform", event.transform)),
      );
    }

    this.#root = this.#adopt(hierarchy(options.data), null);
    this.#root.x0 = 0;
    this.#root.y0 = 0;
    this.#update(this.#root);
  }

  /** The datum of the selected node, if any. */
  getSelected(): T | undefined {
    return this.#selected?.data;
  }

  /** Removes the tree from the page. */
  destroy(): void {
    this.#svg.interrupt().remove();
  }

  /** Turns a d3 hierarchy into tree nodes under `parent`. Only the root starts open. */
  #adopt(node: HierarchyNode<T>, parent: TreeNode<T> | null): TreeNode<T> {
    const depthOffset = parent ? parent.depth + 1 : 0;
    for (const n of node.descendants()) {
      const state = n as unknown as TreeNode<T>;
      state.key = ++this.#nextId;
      (state as { depth: number }).depth = n.depth + depthOffset;
      state.allChildren = state.children;
      if (state.depth > 0) state.children = undefined;
      state.lazy = !n.children && Array.isArray(n.data.children) && n.data.children.length === 0;
      state.loading = false;
    }
    const adopted = node as unknown as TreeNode<T>;
    adopted.parent = parent;
    return adopted;
  }

  #canOpen(node: TreeNode<T>): boolean {
    if (node.allChildren?.length) return true;
    return node.lazy && !node.allChildren && Boolean(this.#options.loadChildren);
  }

  #allNodes(): TreeNode<T>[] {
    const all: TreeNode<T>[] = [];
    const visit = (node: TreeNode<T>) => {
      all.push(node);
      node.allChildren?.forEach(visit);
    };
    visit(this.#root);
    return all;
  }

  async #toggle(node: TreeNode<T>): Promise<void> {
    if (node.loading) return;
    if (node.children) {
      node.children = undefined;
      this.#update(node);
      return;
    }
    if (!this.#canOpen(node)) return;

    const { loadChildren } = this.#options;
    if (!node.allChildren && loadChildren) {
      node.loading = true;
      this.#update(node);
      let data: T[];
      try {
        data = await loadChildren(node.data);
      } catch (error) {
        node.loading = false;
        this.#update(node);
        this.#options.onError(error, node.data);
        return;
      }
      node.loading = false;
      if (data.length === 0) {
        node.lazy = false;
        this.#update(node);
        return;
      }
      node.allChildren = data.map((datum) => this.#adopt(hierarchy(datum), node));
    }

    if (this.#options.accordion) this.#closeSiblings(node);
    node.children = node.allChildren;
    this.#update(node);
  }

  #closeSiblings(node: TreeNode<T>): void {
    for (const other of this.#allNodes()) {
      if (other === node || other.depth !== node.depth || !other.children) continue;
      other.children = undefined;
      if (other.lazy) other.allChildren = undefined;
    }
  }

  #select(node: TreeNode<T>): void {
    this.#selected = node;
    this.#nodes
      .selectAll<SVGGElement, TreeNode<T>>("g.node")
      .classed("selected", (d) => d === node);
    this.#options.onSelect?.(node.data);
  }

  #update(source: TreeNode<T>): void {
    const { levelWidth, rowHeight, duration, label } = this.#options;
    tree<T>().nodeSize([rowHeight, levelWidth])(this.#root);

    const nodes = this.#root.descendants() as unknown as TreeNode<T>[];
    const links = this.#root.links() as unknown as { source: TreeNode<T>; target: TreeNode<T> }[];

    let top = this.#root;
    let bottom = this.#root;
    for (const node of nodes) {
      if (node.x < top.x) top = node;
      if (node.x > bottom.x) bottom = node;
    }
    const width = this.#container.clientWidth || 960;
    const height = bottom.x - top.x + MARGIN.top + MARGIN.bottom;
    const t = transition().duration(duration);
    this.#svg
      .transition(t)
      .attr("height", height)
      .attr("viewBox", [-MARGIN.left, top.x - MARGIN.top, width, height].join(" "));

    const node = this.#nodes
      .selectAll<SVGGElement, TreeNode<T>>("g.node")
      .data(nodes, (d) => String(d.key));

    const nodeEnter = node
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("role", "treeitem")
      .attr("tabindex", 0)
      .attr("transform", `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .on("keydown", (event: KeyboardEvent, d) => {
        if (event.key === "Enter") void this.#toggle(d);
        if (event.key === " ") {
          event.preventDefault();
          this.#select(d);
        }
      });

    nodeEnter
      .append("circle")
      .attr("r", 4.5)
      .on("click", (_event, d) => void this.#toggle(d));

    nodeEnter
      .append("text")
      .attr("dy", "0.32em")
      .text((d) => label(d.data))
      .on("click", (_event, d) => this.#select(d));

    const nodeUpdate = node.merge(nodeEnter);
    nodeUpdate
      .classed("closed", (d) => !d.children && this.#canOpen(d))
      .classed("loading", (d) => d.loading)
      .attr("aria-expanded", (d) => (this.#canOpen(d) ? String(Boolean(d.children)) : null))
      .attr("aria-busy", (d) => (d.loading ? "true" : null));
    // Labels of nodes that can open sit left of the dot, so the links to their children
    // do not run through them; leaf labels sit right.
    nodeUpdate
      .select("text")
      .attr("x", (d) => (this.#canOpen(d) ? -10 : 10))
      .attr("text-anchor", (d) => (this.#canOpen(d) ? "end" : "start"));
    nodeUpdate
      .transition(t)
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1);

    node
      .exit()
      .transition(t)
      .remove()
      .attr("transform", `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0);

    const diagonal = linkHorizontal<unknown, { x: number; y: number }>()
      .x((d) => d.y)
      .y((d) => d.x);

    const link = this.#links
      .selectAll<SVGPathElement, { target: TreeNode<T> }>("path.link")
      .data(links, (d) => String(d.target.key));

    const linkEnter = link
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", () => {
        const origin = { x: source.x0, y: source.y0 };
        return diagonal({ source: origin, target: origin });
      });

    link
      .merge(linkEnter)
      .transition(t)
      .attr("d", (d) => diagonal(d as unknown as { source: TreeNode<T>; target: TreeNode<T> }));

    link
      .exit()
      .transition(t)
      .remove()
      .attr("d", () => {
        const origin = { x: source.x, y: source.y };
        return diagonal({ source: origin, target: origin });
      });

    for (const d of nodes) {
      d.x0 = d.x;
      d.y0 = d.y;
    }
  }
}
