# Collapsible Tree

A collapsible [D3](https://d3js.org) tree that loads children on demand. It started as a
derived version of the classic D3 collapsible tree, made easier to use from application code.

- Lazy loading: return the children of a node from a promise
- Selection with a callback, keyboard support and ARIA tree roles
- Optional zoom and pan, and an accordion mode
- TypeScript, D3 v7 modules (no jQuery), themable with CSS custom properties

**[Live demo](https://velovsky.github.io/Derived-D3.js-Collapsible-Tree/)**

## Install

```bash
npm install github:velovsky/Derived-D3.js-Collapsible-Tree
```

The package builds itself on install (`prepare`). It needs a bundler such as Vite, because it
imports the D3 modules it uses (`d3-hierarchy`, `d3-selection`, `d3-shape`, `d3-transition`,
`d3-zoom`).

## Usage

```ts
import { CollapsibleTree } from "derived-d3-collapsible-tree";
import "derived-d3-collapsible-tree/style.css";

const tree = new CollapsibleTree("#tree", {
  data: {
    name: "Users",
    children: [
      { name: "Ann", id: 1, children: [] }, // [] = children not loaded yet
      { name: "Bob", id: 2, children: [] },
    ],
  },
  loadChildren: async (user) => {
    const response = await fetch(`/api/users/${user.id}/posts`);
    const posts = await response.json();
    return posts.map((post) => ({ name: post.title, id: post.id }));
  },
  onSelect: (datum) => console.log("selected", datum),
  zoom: true,
});

tree.getSelected(); // the selected datum, or undefined
tree.destroy(); // removes the SVG
```

### Data

Each node has a `name` and optional `children`. Other fields are kept and passed back to your
callbacks.

| `children`            | Meaning                                                      |
| --------------------- | ------------------------------------------------------------ |
| missing               | A leaf.                                                      |
| a non-empty array     | Children that are already known.                             |
| an empty array (`[]`) | Children that are not loaded yet. `loadChildren` loads them. |

`loadChildren` runs once per node. If it returns an empty array, the node becomes a leaf. If it
throws, the tree calls `onError` (default: `console.error`) and the node stays closed.

### Options

| Option         | Default         | Description                                                                                               |
| -------------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| `data`         | required        | The root node.                                                                                            |
| `loadChildren` | –               | `(datum) => children \| Promise<children>` for lazy nodes.                                                |
| `onSelect`     | –               | Called with the datum when the user selects a label.                                                      |
| `onError`      | `console.error` | Called when `loadChildren` fails.                                                                         |
| `label`        | `d => d.name`   | The text of a node.                                                                                       |
| `levelWidth`   | `180`           | Horizontal distance between levels, in px.                                                                |
| `rowHeight`    | `22`            | Vertical distance between rows, in px.                                                                    |
| `duration`     | `750`           | Transition duration, in ms.                                                                               |
| `zoom`         | `false`         | Lets the user pan and zoom.                                                                               |
| `accordion`    | `false`         | Opening a node closes the other open nodes on its level. Lazy nodes closed this way load again next time. |

### Interaction

| Action               | Mouse           | Keyboard         |
| -------------------- | --------------- | ---------------- |
| Open or close a node | Click the dot   | Tab to it, Enter |
| Select a node        | Click the label | Tab to it, Space |

### Theming

Override the custom properties on `.collapsible-tree`:

```css
.collapsible-tree {
  --tree-accent: #2563eb;
  --tree-link: #cbd5e1;
}
```

Available: `--tree-link`, `--tree-node`, `--tree-node-closed`, `--tree-text`, `--tree-halo`,
`--tree-accent`.

## Development

```bash
npm install
npm run dev        # demo with hot reload
npm test           # Vitest + jsdom
npm run lint && npm run typecheck
npm run build      # dist/ (ES module, types, CSS)
```

## Changes in 2.0

Version 1 (2018) used D3 v3 and jQuery. Version 2 is a rewrite:

- D3 v7 modules, no jQuery, no IE polyfills. TypeScript with type declarations.
- `new d3_tree_object().generate(input)` is now `new CollapsibleTree(target, options)`.
- `clickCallBack` that mutated `d.children` / `d._children` and returned a jQuery promise is now
  `loadChildren`, which returns the children (or a native promise of them).
- `toggleMode: 1` is now `accordion: true`. `getActiveNode()` is now `getSelected()`.
- The tree grows with its content instead of a fixed container height.
- New: `onSelect`, `onError`, `label`, `rowHeight`, keyboard support, ARIA roles, CSS theming.

## License

GPL-3.0. This library builds on [D3](https://d3js.org) and is not affiliated with it.
