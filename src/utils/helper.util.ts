import type { TSplitsSchema } from "../types/expense.type.js";

export const hasDuplicateSplittedForId = (splits: TSplitsSchema[]): boolean => {
  const seen = new Set<string>();

  for (const split of splits) {
    if (seen.has(split.splittedFor.toString())) {
      return true; // Found a duplicate
    }
    seen.add(split.splittedFor.toString());
  }

  return false; // No duplicates found
};
