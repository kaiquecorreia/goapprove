import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import pkg from "./package.json";

function getAppVersion() {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return pkg.version;
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: getAppVersion(),
  },
};

export default nextConfig;
