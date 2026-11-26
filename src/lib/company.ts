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

/**
 * Builds a mailto: URL for requesting updates to a live/locked startup listing.
 */
export function getStartupUpdateMailto(startupName: string): string {
  const email = getContactEmail();
  const subject = encodeURIComponent(`Update request: ${startupName}`);
  const body = encodeURIComponent(
    "Hi team,\n\nPlease list the changes you'd like to make to your listing and attach any updated images:\n\n"
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}


