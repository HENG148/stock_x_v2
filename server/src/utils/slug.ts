import { randomBytes } from "node:crypto";

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+||-+$/g, "")
    .slice(0, 150)
    .replace(/-+$/g, "");
}

export async function generateUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || "item";
  if (!(await exists(root))) return root;
  for (let suffix = 2; suffix <= 50; suffix += 1) {
    const candidate = `${root}-${suffix}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${root}-${randomBytes(3).toString("hex")}`;
}