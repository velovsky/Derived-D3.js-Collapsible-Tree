import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CollapsibleTree, type TreeDatum } from "./index";

interface Item extends TreeDatum {
  id?: number;
  children?: Item[];
}

const data = (): Item => ({
  name: "root",
  children: [
    { name: "a", children: [{ name: "a1" }, { name: "a2", children: [{ name: "a2x" }] }] },
    { name: "b", children: [{ name: "b1" }] },
    { name: "leaf" },
  ],
});

/** Waits for transitions (duration 0) and pending promises. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 40));

let container: HTMLDivElement;
let tree: CollapsibleTree<Item> | undefined;

function labels(): string[] {
  return [...container.querySelectorAll("g.node text")].map((t) => t.textContent ?? "");
}

function node(name: string): SVGGElement {
  const text = [...container.querySelectorAll("g.node text")].find((t) => t.textContent === name);
  if (!text) throw new Error(`no node ${name}; nodes: ${labels().join(", ")}`);
  return text.parentNode as SVGGElement;
}

function clickCircle(name: string): void {
  node(name)
    .querySelector("circle")!
    .dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function clickLabel(name: string): void {
  node(name)
    .querySelector("text")!
    .dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.replaceChildren(container);
});

afterEach(() => tree?.destroy());

describe("CollapsibleTree", () => {
  it("shows the root and its children, and closes deeper levels", async () => {
    tree = new CollapsibleTree(container, { data: data(), duration: 0 });
    await settle();

    expect(labels().sort()).toEqual(["a", "b", "leaf", "root"]);
    expect(node("a").classList.contains("closed")).toBe(true);
    expect(node("leaf").classList.contains("closed")).toBe(false);
    expect(node("a").getAttribute("aria-expanded")).toBe("false");
  });

  it("opens and closes a node", async () => {
    tree = new CollapsibleTree(container, { data: data(), duration: 0 });
    clickCircle("a");
    await settle();
    expect(labels()).toContain("a1");
    expect(labels()).not.toContain("a2x");

    clickCircle("a");
    await settle();
    expect(labels()).not.toContain("a1");
  });

  it("loads lazy children once", async () => {
    const loadChildren = vi.fn(async (item: Item) =>
      [1, 2].map((n) => ({ name: `${item.name}-${n}`, children: [] as Item[] })),
    );
    tree = new CollapsibleTree<Item>(container, {
      data: { name: "users", children: [{ name: "ann", children: [] }] },
      loadChildren,
      duration: 0,
    });

    clickCircle("ann");
    expect(node("ann").classList.contains("loading")).toBe(true);
    await settle();
    expect(labels()).toEqual(expect.arrayContaining(["ann-1", "ann-2"]));
    expect(node("ann").classList.contains("loading")).toBe(false);
    expect(node("ann-1").classList.contains("closed")).toBe(true);

    clickCircle("ann");
    await settle();
    clickCircle("ann");
    await settle();
    expect(loadChildren).toHaveBeenCalledTimes(1);
  });

  it("treats an empty lazy result as a leaf", async () => {
    tree = new CollapsibleTree<Item>(container, {
      data: { name: "root", children: [{ name: "empty", children: [] }] },
      loadChildren: async () => [],
      duration: 0,
    });
    clickCircle("empty");
    await settle();
    expect(node("empty").classList.contains("closed")).toBe(false);
    expect(labels()).toEqual(["root", "empty"]);
  });

  it("reports a failed load and stops the spinner", async () => {
    const onError = vi.fn();
    tree = new CollapsibleTree<Item>(container, {
      data: { name: "root", children: [{ name: "x", children: [] }] },
      loadChildren: async () => {
        throw new Error("offline");
      },
      onError,
      duration: 0,
    });
    clickCircle("x");
    await settle();
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ name: "x" }));
    expect(node("x").classList.contains("loading")).toBe(false);
  });

  it("in accordion mode closes the open sibling and reloads lazy nodes", async () => {
    const loadChildren = vi.fn(async (item: Item) => [{ name: `${item.name}-child` }]);
    tree = new CollapsibleTree<Item>(container, {
      data: {
        name: "root",
        children: [
          { name: "p", children: [] },
          { name: "q", children: [] },
        ],
      },
      loadChildren,
      accordion: true,
      duration: 0,
    });

    clickCircle("p");
    await settle();
    clickCircle("q");
    await settle();
    expect(labels()).toContain("q-child");
    expect(labels()).not.toContain("p-child");

    clickCircle("p");
    await settle();
    expect(loadChildren).toHaveBeenCalledTimes(3);
  });

  it("selects a node by its label", async () => {
    const onSelect = vi.fn();
    tree = new CollapsibleTree(container, { data: data(), onSelect, duration: 0 });
    clickLabel("b");

    expect(tree.getSelected()?.name).toBe("b");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: "b" }));
    expect(node("b").classList.contains("selected")).toBe(true);

    clickLabel("leaf");
    expect(node("b").classList.contains("selected")).toBe(false);
  });

  it("opens with Enter", async () => {
    tree = new CollapsibleTree(container, { data: data(), duration: 0 });
    node("b").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await settle();
    expect(labels()).toContain("b1");
  });

  it("uses a custom label", async () => {
    tree = new CollapsibleTree(container, {
      data: data(),
      label: (d) => d.name.toUpperCase(),
      duration: 0,
    });
    expect(labels()).toContain("ROOT");
  });

  it("accepts a selector and removes itself on destroy", () => {
    container.id = "chart";
    tree = new CollapsibleTree("#chart", { data: data(), zoom: true, duration: 0 });
    expect(container.querySelector("svg.collapsible-tree.zoomable")).not.toBeNull();

    tree.destroy();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("throws when the container is missing", () => {
    expect(() => new CollapsibleTree("#missing", { data: data() })).toThrow(TypeError);
  });
});
