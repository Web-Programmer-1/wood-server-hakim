import { z } from "zod";

export const createMachineSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  categoryId: z.string().uuid(),

  brand: z.string().optional(),
  model: z.string().optional(),

  dynamicButtons: z.array(
    z.object({
      label: z.string(),
      type: z.enum(["link", "action"]),
      url: z.string().optional(),
      actionKey: z.string().optional(),
    })
  ).optional(),
});
