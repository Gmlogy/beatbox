// --- START OF FILE src/api/base44Client.js ---
import { LocalSDK } from '../lib/local-sdk.js';

// Instead of creating a real client, we export our local, offline SDK.
// All other files that import 'base44' from here will now get our local version.
export const base44 = LocalSDK;
// --- END OF FILE src/api/base44Client.js ---