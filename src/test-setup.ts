// jsdom has no SVG transform list. D3 reads `transform.baseVal.consolidate()` to animate the
// `transform` attribute, so give it a minimal one that understands translate(x,y).
Object.defineProperty(SVGElement.prototype, "transform", {
  get(this: SVGElement) {
    const transform = this.getAttribute("transform") ?? "";
    return {
      baseVal: {
        consolidate() {
          const match = /translate\(\s*([-\d.e]+)[ ,]+([-\d.e]+)\s*\)/.exec(transform);
          if (!match) return null;
          return { matrix: { a: 1, b: 0, c: 0, d: 1, e: Number(match[1]), f: Number(match[2]) } };
        },
      },
    };
  },
});
