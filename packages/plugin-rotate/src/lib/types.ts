import { BasePluginConfig } from "@embedpdf/core";
import { Rotation } from "@embedpdf/models";

export interface RotatePluginConfig extends BasePluginConfig {
  defaultRotation?: Rotation;
}

export interface RotateCapability {
  onRotateChange(handler: (rotation: Rotation) => void): void;
  setRotation(rotation: Rotation): void;
  getRotation(): Rotation;
  rotateForward(): void;
  rotateBackward(): void;
}

export interface RotateState {
  rotation: Rotation;
}