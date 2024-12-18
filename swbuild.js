import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["./app/sw.js"],
  entryNames: "[dir]/[name]-[hash]",
  outdir: `./public`,
  bundle: true,
  minify: true,
  target: ["esnext"],
  format: "esm",
});
