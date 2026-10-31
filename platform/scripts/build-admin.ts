/**
 * Builds the admin dashboard into public/admin.
 *   pnpm admin:build          production build
 *   pnpm admin:watch          rebuild on change (use with `pnpm dev`)
 *
 * CSS: Tailwind v4's compiler (the `tailwindcss` package, no dependencies) runs
 * directly, and esbuild minifies the result. This skips @tailwindcss/cli,
 * whose lightningcss dependency is MPL-2.0 and outside the Build Agreement's
 * license list.
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import * as esbuild from "esbuild";
import { compile } from "tailwindcss";

const watch = process.argv.includes("--watch");
const dev = watch || process.argv.includes("--dev");
const srcDir = resolve("admin/src");
const outdir = "public/admin";

async function listSources(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? listSources(join(dir, e.name)) : /\.(tsx?|jsx?)$/.test(e.name) ? [join(dir, e.name)] : [])),
  );
  return files.flat();
}

/** Every token that could be a class name. Tailwind ignores anything that isn't one. */
async function candidates(): Promise<string[]> {
  const found = new Set<string>();
  for (const file of await listSources(srcDir)) {
    const text = await readFile(file, "utf8");
    for (const raw of text.split(/[\s"'`]+/)) {
      if (!raw || raw.length > 200) continue;
      found.add(raw);
      const trimmed = raw.replace(/^[({[,;]+|[)}\],;]+$/g, "");
      if (trimmed) found.add(trimmed);
    }
  }
  return [...found];
}

function packageStylesheet(id: string): string | null {
  if (id === "tailwindcss") return resolve("node_modules/tailwindcss/index.css");
  if (id === "tw-animate-css") return resolve("node_modules/tw-animate-css/dist/tw-animate.css");
  return null;
}

async function buildCss(): Promise<string> {
  const entry = join(srcDir, "styles.css");
  const compiler = await compile(await readFile(entry, "utf8"), {
    base: srcDir,
    loadStylesheet: async (id, base) => {
      const path = packageStylesheet(id) ?? (id.startsWith("tailwindcss/") ? resolve("node_modules", id) : resolve(base, id));
      return { path, base: dirname(path), content: await readFile(path, "utf8") };
    },
  });
  const css = compiler.build(await candidates());
  const { code } = await esbuild.transform(css, { loader: "css", minify: !dev, target: ["chrome111", "safari16.4", "firefox128"] });
  return code;
}

async function writeOutputs(jsFile: string) {
  const css = await buildCss();
  const cssName = watch ? "app.css" : `app-${createHash("sha256").update(css).digest("hex").slice(0, 8)}.css`;
  await writeFile(join(outdir, cssName), css);
  const template = await readFile("admin/index.html", "utf8");
  await writeFile(join(outdir, "index.html"), template.replace("__JS__", basename(jsFile)).replace("__CSS__", cssName));
}

const options: esbuild.BuildOptions = {
  entryPoints: ["admin/src/main.tsx"],
  bundle: true,
  outdir,
  entryNames: watch ? "app" : "app-[hash]",
  format: "esm",
  target: ["es2022", "safari16"],
  jsx: "automatic",
  tsconfig: "admin/tsconfig.json",
  minify: !dev,
  sourcemap: dev,
  metafile: true,
  define: { "process.env.NODE_ENV": JSON.stringify(dev ? "development" : "production") },
  logLevel: "info",
  plugins: [
    {
      name: "tailwind-and-html",
      setup(build) {
        build.onEnd(async (result) => {
          if (result.errors.length) return;
          const js = Object.keys(result.metafile?.outputs ?? {}).find((f) => f.endsWith(".js"));
          if (!js) throw new Error("Admin build produced no JS");
          await writeOutputs(js);
        });
      },
    },
  ],
};

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });
if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("Watching admin/ for changes…");
} else {
  await esbuild.build(options);
}
