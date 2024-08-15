import { ExpenseCategory } from "../constants/expense.constant.js";

// Helper function to check if a single value is empty
const isValueEmpty = (value: unknown): value is null | undefined | "" => {
  return value === undefined || value === null || value === "";
};

// does: check if anything is empty or not
export const isAnythingEmpty = (...values: unknown[]): boolean => {
  return values.some(isValueEmpty);
};

// does: check if everything is empty or not
export const isEverythingEmpty = (...values: unknown[]): boolean => {
  return values.every(
    (value) => value === undefined || value === null || value === ""
  );
};

// does: check specifically if an array is non empty or not
export const isNonEmptyArray = (value: unknown): value is any[] => {
  return Array.isArray(value) && value.length > 0;
};

// does: check if input category is included in enums nor not
export function isValidCategory(category: string): category is ExpenseCategory {
  return Object.values(ExpenseCategory).includes(category as ExpenseCategory);
}
