import { Prisma } from "@prisma/client";

export const applyMachineSizePresetFilter = (
  sizePreset: string,
  andConditions: Prisma.ProductWhereInput[]
) => {
  const presetMap: Record<
    string,
    {
      minWidthMm: number;
      maxWidthMm: number;
      minLengthMm: number;
      maxLengthMm: number;
    }
  > = {
    "2x3": {
      minWidthMm: 550,
      maxWidthMm: 700,
      minLengthMm: 850,
      maxLengthMm: 1000,
    },

    "4x4": {
  minWidthMm: 950,
  maxWidthMm: 1250,
  minLengthMm: 1000,
  maxLengthMm: 1250,
},
    "4x8": {
      minWidthMm: 1200,
      maxWidthMm: 1400,
      minLengthMm: 2400,
      maxLengthMm: 2600,
    },
    "5x10": {
      minWidthMm: 1450,
      maxWidthMm: 1550,
      minLengthMm: 2950,
      maxLengthMm: 3050,
    },
  };

  const normalizedPreset = sizePreset.trim().toLowerCase();
  const selectedPreset = presetMap[normalizedPreset];

  if (!selectedPreset) return;

  andConditions.push({
    workingWidthMm: {
      gte: selectedPreset.minWidthMm,
      lte: selectedPreset.maxWidthMm,
    },
    workingLengthMm: {
      gte: selectedPreset.minLengthMm,
      lte: selectedPreset.maxLengthMm,
    },
  });
};