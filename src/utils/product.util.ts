const MM_TO_FT = 304.8;

export const mmToFt = (mm: number) => {
  if (!mm) return null;
  return Number((mm / MM_TO_FT).toFixed(2));
};

export const formatMachineSize = (
  widthMm?: number | null,
  lengthMm?: number | null
) => {
  if (!widthMm || !lengthMm) return null;

  const widthFt = mmToFt(widthMm);
  const lengthFt = mmToFt(lengthMm);

  return {
    widthMm,
    lengthMm,
    widthFt,
    lengthFt,
    display: `${widthMm}×${lengthMm} mm (${widthFt}×${lengthFt} ft)`,
  };
};