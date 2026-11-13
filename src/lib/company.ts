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


