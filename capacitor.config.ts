import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mermaid.diagram",
  appName: "Mermaid Diagram",
  webDir: "dist",
  android: {
    allowMixedContent: true,
  },
};

export default config;
