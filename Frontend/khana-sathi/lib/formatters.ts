/**
 * Formats a numeric amount into a currency string with NPR/Rs. prefix.
 * @param amount - The numeric value to format
 * @returns A formatted string like "NPR 1,200"
 */
export const formatCurrency = (amount: number): string => {
    return `NPR ${amount.toLocaleString('en-NP')}`;
};

/**
 * Normalizes price range markers for display.
 * @param range - The price range marker (e.g. "$$", "Rs.Rs.")
 * @returns Normalized marker based on current currency setting
 */
export const formatPriceRange = (range: string): string => {
    if (!range) return "Rs.Rs.";
    return range.replace(/\$/g, "Rs.");
};
