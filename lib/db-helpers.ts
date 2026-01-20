/**
 * Database Helpers (Backward Compatibility)
 *
 * This file re-exports from the new modular db structure.
 * New code should import directly from @/lib/db.
 *
 * @deprecated Import from @/lib/db instead
 */

export {
  assembleSearchResultFromDB,
  getSearchStatusFromDB as getSearchStatus,
} from "./db/assemblers";
