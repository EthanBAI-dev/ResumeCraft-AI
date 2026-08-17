import { chromium } from "playwright";

/** 容器使用 Playwright 自带浏览器；本地可显式复用已安装的 Chromium。 */
export function launchBrowser() {
  return chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : {}),
  });
}
