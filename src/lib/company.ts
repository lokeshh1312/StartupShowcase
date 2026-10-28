export const legalName = "WAVERISE CONSULTANCY PRIVATE LIMITED";
export const gstin = "23AADCW8958R1ZB";
export const address =
  "House No. 5, Gali No. 1, Dwarka Nagar, Nishatpura, Bhopal, Madhya Pradesh – 462010, India.";
export const phone = "+91 97247 19086";
export const website = "https://startupshowcaseglobal.com/";

/**
 * Returns the contact email from environment variable or production default.
 * Respects NEXT_PUBLIC_CONTACT_EMAIL setting.
 */
export function getContactEmail(): string {
  return (
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
    "contact@startupshowcaseglobal.com"
  );
}

