import { z } from "zod";

const configSchema = z.object({
  source: z.string(),
  build: z.object({
    target: z.string().optional(),
  }),
  ignore: z.optional(z.array(z.string())),
});
export type Config = z.infer<typeof configSchema>;

export const defaultConfig: Config = {
  source: "src/",
  build: {},
};

export const defaultConfigPath = "dstag.config.json";

export async function generateConfig() {
  if (await Bun.file(defaultConfigPath).exists()) {
    throw "configuration already exists";
  }
  Bun.write(defaultConfigPath, JSON.stringify(defaultConfig, undefined, 2));
}

export async function checkConfig() {
  if (await Bun.file(defaultConfigPath).exists()) {
    return configSchema.parse(await Bun.file(defaultConfigPath).json());
  }
  throw "config file does not exist. Use `dstag init` to create one.";
}
