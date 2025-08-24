// --- START OF FILE src/api/entities/index.js ---
import { LocalSDK } from '../../local-backend/db.js';

// This file intercepts calls to the "entities" API and redirects them to our local SDK.
export const Track = LocalSDK.entities.Track;
export const Playlist = LocalSDK.entities.Playlist;
export const SyncDevice = LocalSDK.entities.SyncDevice;
export const SyncJob = LocalSDK.entities.SyncJob;
export const PlayHistory = LocalSDK.entities.PlayHistory;
// --- END OF FILE src/api/entities/index.js ---