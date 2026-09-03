/**
 * Admin auth store.
 *
 * Stores the short-lived JWT access token in memory only (not localStorage)
 * to prevent XSS theft. The refresh token lives in an httpOnly cookie managed
 * by the backend — the browser sends it automatically on /refresh calls.
 *
 * On app load (or page reload) AdminLayout calls `tryRefresh()` to silently
 * obtain a fresh access token using the cookie.
 */
import { create } from 'zustand';
import { adminLogin as apiLogin, adminLogout as apiLogout, adminRefresh } from '../api/adminApi';

export const useAdminStore = create((set, get) => ({
  /** @type {{ id: number, name: string, email: string, role: string } | null} */
  admin: null,

  /** @type {string | null} In-memory only — never persisted. */
  accessToken: null,

  /** null = unknown (not yet checked), true = authenticated, false = not authenticated */
  isAuthenticated: null,

  /**
   * Call the real login API and store the access token.
   * The backend also sets the admin_refresh_token httpOnly cookie.
   */
  async login(email, password) {
    const json = await apiLogin(email, password);
    // json.data = { admin: {id, name, email, role}, accessToken }
    const { admin, accessToken } = json.data;
    set({ admin, accessToken, isAuthenticated: true });
    return admin;
  },

  /**
   * Silently refresh the access token using the httpOnly cookie.
   * Called on every AdminLayout mount to handle page reloads.
   * Returns true if successful, false if the cookie is missing/expired.
   */
  async tryRefresh() {
    try {
      const json = await adminRefresh();
      // json.data = { accessToken }
      const { accessToken } = json.data;
      // We don't get admin info from refresh — keep existing or fetch separately.
      // For now, decode the JWT payload to get role (no verification needed client-side).
      const payload = parseJwt(accessToken);
      const existing = get().admin;
      set({
        accessToken,
        isAuthenticated: true,
        // Keep existing admin info if we have it; otherwise build from token
        admin: existing || { id: payload?.adminId, role: payload?.role },
      });
      return true;
    } catch {
      set({ admin: null, accessToken: null, isAuthenticated: false });
      return false;
    }
  },

  /**
   * Call the real logout API (revokes refresh token server-side), then clear local state.
   */
  async logout() {
    try {
      await apiLogout(get().accessToken);
    } catch {
      // Best effort — clear local state regardless
    }
    set({ admin: null, accessToken: null, isAuthenticated: false });
  },

  /** Helper used by API calls in components. */
  getAccessToken() {
    return get().accessToken;
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Decode a JWT payload without verifying the signature.
 * Used only to extract non-sensitive claims (adminId, role) client-side.
 */
function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}
