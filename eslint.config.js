import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    // supabase/functions roda em Deno, com toolchain de lint próprio
    // (deno lint) — fora do escopo deste eslint, que cobre só o app.
    ignores: ["dist/**", ".output/**", "routeTree.gen.ts", "node_modules/**", "supabase/functions/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
);
