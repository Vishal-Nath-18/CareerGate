import * as Babel from "@babel/standalone";

/**
 * Uses Babel's real scope analysis (the same parser jsx-transformer.ts
 * already depends on) to find calls to setState-style setters
 * (e.g. setEyeL(...)) that have no declaration anywhere in scope —
 * i.e. never created via useState, never destructured from props,
 * never passed as a function parameter.
 */
const KNOWN_GLOBAL_SETTERS = new Set(["setInterval", "setTimeout", "setImmediate"]);

export function findUndefinedSetters(code: string, filename: string): string[] {
  const found = new Set<string>();

  // Babel plugin factory — runs as part of the normal transform pass,
  // so it sees the exact same AST/scope Babel builds for real.
  function setterCheckPlugin() {
    return {
      visitor: {
        CallExpression(path: any) {
          const callee = path.node.callee;
          if (
            callee.type === "Identifier" &&
            /^set[A-Z]/.test(callee.name) &&
            !KNOWN_GLOBAL_SETTERS.has(callee.name)
          ) {
            const binding = path.scope.getBinding(callee.name);
            if (!binding) {
              found.add(callee.name);
            }
          }
        },
      },
    };
  }

  try {
    const isTypeScript = filename.endsWith(".ts") || filename.endsWith(".tsx");
    Babel.transform(code, {
      filename,
      presets: [
        ["react", { runtime: "automatic" }],
        ...(isTypeScript ? ["typescript"] : []),
      ],
      plugins: [setterCheckPlugin],
    });
  } catch {
    // If the file doesn't even parse, that's a separate syntax-error
    // path already handled elsewhere — this validator only concerns
    // itself with successfully-parsed code that references undefined setters.
    return [];
  }

  return Array.from(found);
}