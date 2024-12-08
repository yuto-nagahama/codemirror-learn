import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["./app/sw.js"],
  bundle: true,
  minify: true,
  target: ["esnext"],
  format: "esm",
  outfile: `./public/sw.js`,
});
