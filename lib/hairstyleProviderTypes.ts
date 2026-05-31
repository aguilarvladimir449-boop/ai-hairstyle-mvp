import type { Buffer } from "node:buffer";
import type { SelectedHairColor } from "@/lib/hairColor";

export type GenerateHairstyleInput = {
  userImage: File | Blob | Buffer;
  hairstyleId?: string;
  hairstyleReferenceImage?: File | Blob | Buffer;
  mask?: File | Blob | Buffer;
  selectedHairColor?: SelectedHairColor;
  useOriginalHairColor?: boolean;
  useReferenceHairColor?: boolean;
  prompt: string;
};
