import buildAll from "./build";
import { checkConfig, defaultConfig, generateConfig } from "./config";
import packageJSON from "./package.json";
import { Command } from "commander";
const p = new Command();

p.name("dstag")
  .description(packageJSON.description)
  .version(packageJSON.version);

p.command("init").action(() => {
  generateConfig();
});

p.command("build").action(async () => {
  const config = await checkConfig();
  buildAll(config);
});

p.parse();
