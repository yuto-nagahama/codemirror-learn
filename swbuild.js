import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["./sw.ts"],
  outdir: `./public`,
  bundle: true,
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV !== "production",
  target: ["es2023"],
  format: "esm",
});
