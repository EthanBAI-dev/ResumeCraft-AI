import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Vite 7 起原生支持 tsconfig paths，不再需要 vite-tsconfig-paths
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    // 白名单比 `services/**` 排除规则更稳：pnpm workspace 会在子包创建
    // node_modules 链接，Vitest 4 的 glob 可能沿链接扫进依赖包自己的测试源码。
    include: ["{app,components,fixtures,lib}/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // 只对纯逻辑层要求覆盖率 —— UI 组件靠 E2E 覆盖，不刷单测数字
      include: ["lib/schema/**", "lib/layout/**", "lib/store/**"],
      exclude: ["**/*.test.*"],
      thresholds: { statements: 80, branches: 75, functions: 80, lines: 80 },
    },
  },
});
