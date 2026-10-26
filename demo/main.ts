import "../src/collapsible-tree.css";
import { CollapsibleTree, type CollapsibleTreeOptions, type TreeDatum } from "../src/index";
import flare from "./flare.json";

interface Item extends TreeDatum {
  key?: number | string;
  body?: string;
  email?: string;
  children?: Item[];
}

const API = "https://jsonplaceholder.typicode.com";
const form = document.querySelector<HTMLFormElement>("#options")!;
const selectedOutput = document.querySelector<HTMLPreElement>("#selected")!;
let tree: CollapsibleTree<Item> | undefined;

async function getJson<R>(path: string): Promise<R> {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json() as Promise<R>;
}

async function lazyData(): Promise<Pick<CollapsibleTreeOptions<Item>, "data" | "loadChildren">> {
  const users = await getJson<{ id: number; name: string; email: string }[]>("/users");
  return {
    data: {
      name: "Users",
      children: users.map((user) => ({
        name: user.name,
        key: user.id,
        email: user.email,
        children: [],
      })),
    },
    loadChildren: async (user) => {
      const posts = await getJson<{ id: number; title: string; body: string }[]>(
        `/posts?userId=${user.key}`,
      );
      return posts.map((post) => ({ name: post.title, key: post.id, body: post.body }));
    },
  };
}

async function render(): Promise<void> {
  const values = new FormData(form);
  tree?.destroy();
  selectedOutput.textContent = "Click a label.";

  const source = values.get("source") === "static" ? { data: flare as Item } : await lazyData();

  tree = new CollapsibleTree<Item>("#tree", {
    ...source,
    levelWidth: Number(values.get("levelWidth")),
    duration: Number(values.get("duration")),
    zoom: values.has("zoom"),
    accordion: values.has("accordion"),
    onSelect: (datum) => {
      const withoutChildren = (key: string, value: unknown) =>
        key === "children" ? undefined : value;
      selectedOutput.textContent = JSON.stringify(datum, withoutChildren, 2);
    },
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void render();
});

void render();
