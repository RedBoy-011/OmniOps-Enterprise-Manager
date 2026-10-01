import { getStoredCredentials } from './credentialService';

export const CURRENT_AGENT_VERSION = '2.4.0';

export interface VersionCheckResult {
  currentClientVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  mandatory: boolean;
  releaseDate: string;
  changelog: string;
  downloadUrl: string;
  githubDownloadUrl: string;
  sha256: string;
}

/**
 * Pings the Master Server on startup to check if a newer agent binary is available
 */
export async function checkMasterForUpdates(): Promise<VersionCheckResult | null> {
  try {
    const creds = await getStoredCredentials();
    if (!creds.masterUrl) return null;

    const baseUrl = creds.masterUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/api/v1/agent/version?current_version=${CURRENT_AGENT_VERSION}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${creds.exchangeToken}`,
        'X-Agent-Version': CURRENT_AGENT_VERSION
      }
    });

    if (!res.ok) {
      console.warn(`Version check ping failed with HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      currentClientVersion: data.current_client_version || CURRENT_AGENT_VERSION,
      latestVersion: data.latest_version,
      updateAvailable: !!data.update_available,
      mandatory: !!data.mandatory,
      releaseDate: data.release_date || '',
      changelog: data.changelog || '',
      downloadUrl: data.download_url,
      githubDownloadUrl: data.github_download_url,
      sha256: data.sha256 || ''
    };
  } catch (err) {
    console.warn('Network error during agent version check:', err);
    return null;
  }
}
