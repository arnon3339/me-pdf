import { IPlugin, PluginRegistry } from "@embedpdf/core";
import { PageManagerPluginConfig } from "./types";

export class PageManagerPlugin implements IPlugin<PageManagerPluginConfig> {
  constructor(
    public readonly id: string,
    private registry: PluginRegistry,
  ) {
  }
}