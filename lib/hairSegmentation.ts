export type HairSegmentationResult = {
  mask: HTMLCanvasElement;
};

export async function segmentHair(): Promise<HairSegmentationResult> {
  // TODO: Integrate ONNX hair segmentation or face parsing model here.
  // The first MVP keeps manual masks as the reliable fallback.
  throw new Error("自动头发分割尚未接入，请先使用手动画笔选择头发区域。");
}
