import { evaluate } from "dvm-utils";
import { Program } from "dvm-utils/src/types/program";
import { generateApi, generateLib } from "./generate";
import { Config } from "./config";
import * as fs from "fs";

//import config from "./build.config";
//const code: string = await Bun.file(Bun.argv[2]).text();

export default function buildAll(config: Config) {
  try {
    const lib = generateLib();
    const distFolder = "dist";
    const distLibPath = `${distFolder}/lib.ts`;
    Bun.write(distLibPath, lib);
    if (config.build.target !== undefined) {
      fs.mkdirSync(`${config.build.target}`, { recursive: true });
      const libPath = `${config.build.target}/lib.ts`;
      Bun.write(libPath, lib);
    }

    fs.readdirSync(config.source)
      .filter((path) => path.endsWith(".bas"))
      .forEach(async (path) => {
        const scName = path.slice(0, -4);

        path = `${config.source}/${path}`;
        const code = await Bun.file(path).text();

        const program: Program = evaluate(code);
        console.log(
          "SC: ",
          scName,
          "\nEvaluated: ",
          program.functions.map((f) => f.name).join(", ")
        );

        // TODO use mapping for minified code
        const api = generateApi(program);

        fs.mkdirSync(`${distFolder}/${scName}`, { recursive: true });

        const distApiPath = `${distFolder}/${scName}/api.ts`;
        Bun.write(distApiPath, api);

        if (
          config.build.target !== undefined &&
          (config.ignore === undefined || config.ignore.indexOf(path) == -1) // prevent writing file if ignored in config
        ) {
          fs.mkdirSync(`${config.build.target}/${scName}`, { recursive: true });

          const apiPath = `${config.build.target}/${scName}/api.ts`;
          Bun.write(apiPath, api);
        }
      });
  } catch (error) {
    throw "Failed to evaluate DVM-BASIC code: " + error;
  }
}
