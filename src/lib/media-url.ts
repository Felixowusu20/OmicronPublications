import { z } from "zod";

/** Absolute http(s) URL or a site-relative path (e.g. /hero/research-fields.jpg). */
export const mediaUrlSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      /^https?:\/\//i.test(value) ||
      value.startsWith("/") ||
      value.startsWith("data:image/"),
    { message: "Must be a URL or site path starting with /" },
  );

export const optionalMediaUrlSchema = mediaUrlSchema.optional().nullable();
