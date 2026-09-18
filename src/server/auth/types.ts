export interface UserContext {
  userId: string;
  name: string;
  email: string;
  /** Anonymous visitor who started an analysis and has not created an account yet. */
  isGuest: boolean;
  /** Saved language preference, if any. */
  locale?: string | null;
}
