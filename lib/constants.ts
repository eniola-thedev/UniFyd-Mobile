export const UNIVERSITIES = [
  { value: "UNILORIN", label: "University of Ilorin" },
  { value: "AL_HIKMAH", label: "Al-Hikmah University" },
  { value: "KWASU", label: "Kwara State University" },
  { value: "UNIOSUN", label: "Osun State University" },
] as const;

export const LIVING_TYPES = [
  { value: "SCHOOL_HOSTEL", label: "School Hostel" },
  { value: "OFF_CAMPUS_HOSTEL", label: "Off Campus Hostel" },
  { value: "PRIVATE_APARTMENT", label: "Private Apartment" },
] as const;

export const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
] as const;

export const CATEGORIES = [
  { group: "Electronics", items: ["Phones", "Laptops", "TVs", "Speakers", "Chargers"] },
  { group: "Hostel Items", items: ["Bed Frames", "Mattresses", "Fans", "Air Conditioners", "Gas Cylinders", "Cookers", "Chairs", "Tables"] },
  { group: "Fashion", items: ["Clothes", "Shoes", "Bags"] },
  { group: "Academic", items: ["Books", "Calculators"] },
  { group: "Gaming", items: ["Consoles", "Controllers"] },
  { group: "Others", items: ["Others"] },
] as const;

export const ALL_CATEGORIES = CATEGORIES.flatMap((c) => c.items);

export const LISTING_PLANS = [
  {
    value: "FREE" as const,
    name: "Free Listing",
    price: 0,
    perks: ["New users only", "One item maximum", "Visible for 3 days"],
  },
  {
    value: "BASIC" as const,
    name: "Basic Listing",
    price: 300,
    perks: ["Visible for 7 days", "Standard search ranking"],
  },
  {
    value: "FEATURED" as const,
    name: "Featured Listing",
    price: 700,
    perks: ["Visible for 14 days", "Appears higher in search", "Featured badge"],
  },
  {
    value: "CLEARANCE" as const,
    name: "Clearance Listing",
    price: 2000,
    perks: ["Visible for 30 days", "Multiple items promoted", "Featured visibility", "Clearance badge"],
  },
];

export const COMING_SOON_LISTING_PLANS = [
  { name: "Store", description: "A dedicated storefront for regular sellers." },
  { name: "Vendor", description: "Tools for managing a larger catalogue." },
] as const;

export function universityLabel(value: string | null | undefined) {
  return UNIVERSITIES.find((u) => u.value === value)?.label ?? value ?? "";
}

export function livingLabel(value: string | null | undefined) {
  return LIVING_TYPES.find((l) => l.value === value)?.label ?? value ?? "";
}

export function conditionLabel(value: string | null | undefined) {
  return CONDITIONS.find((c) => c.value === value)?.label ?? value ?? "";
}

export function formatNaira(amount: number | string) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}
