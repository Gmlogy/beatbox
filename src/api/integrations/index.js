// --- START OF FILE src/api/integrations/index.js ---
import { LocalSDK } from '../../local-backend/db.js';

// This file intercepts calls to the "integrations" API and redirects them to our local SDK.
export const UploadFile = LocalSDK.integrations.UploadFile;
// --- END OF FILE src/api/integrations/index.js ---