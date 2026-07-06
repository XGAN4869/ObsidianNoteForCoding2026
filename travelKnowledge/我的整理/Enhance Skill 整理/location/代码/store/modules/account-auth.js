export const APP_ACCOUNT_SOURCE = 'app';
export const TEMP_WORKER_ACCOUNT_SOURCE = 'app';
export const LEGACY_TEMP_WORKER_ACCOUNT_SOURCE = 'temp-worker';
const TEMP_WORKER_TOKEN_MARKER = 'TEMP-';

export function parseLoginToken(token) {
  const normalizedToken = String(token || '');
  const separatorIndex = normalizedToken.indexOf('.');

  if (separatorIndex < 0) {
    return {
      accountId: normalizedToken,
      authToken: '',
    };
  }

  return {
    accountId: normalizedToken.slice(0, separatorIndex),
    authToken: normalizedToken.slice(separatorIndex + 1),
  };
}

export function buildStoredToken(token, accountSource) {
  const { accountId, authToken } = parseLoginToken(token);

  return {
    accountId,
    authToken,
    accountSource: normalizeAccountSource(accountSource),
  };
}

export function normalizeAccountSource(accountSource) {
  return APP_ACCOUNT_SOURCE;
}

export function isTempWorkerAuthToken(authToken) {
  return String(authToken || '').includes(TEMP_WORKER_TOKEN_MARKER);
}
