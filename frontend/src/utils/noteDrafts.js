function getUsername() {
  return localStorage.getItem('app_username') || 'default_user';
}

function getDraftStorageKey(draftId, isPrivate) {
  const scope = isPrivate ? 'private-note-draft' : 'note-draft';
  return `${scope}:${getUsername()}:${draftId}`;
}

function encodeBase64(value) {
  const bytes = new Uint8Array(value);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function decodeBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function importDraftKey(keyMaterial) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Trình duyệt không hỗ trợ mã hóa nháp riêng tư.');
  }
  if (!keyMaterial) {
    throw new Error('Hãy mở khóa vùng riêng tư để lưu nháp được mã hóa.');
  }

  return crypto.subtle.importKey('raw', decodeBase64(keyMaterial), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function derivePrivateDraftKey(password, username = getUsername()) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Trình duyệt không hỗ trợ mã hóa nháp riêng tư.');
  }

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(`private-note-drafts:v1:${username}`),
      iterations: 310000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  return encodeBase64(await crypto.subtle.exportKey('raw', key));
}

export async function loadNoteDraft(draftId, { isPrivate = false, keyMaterial } = {}) {
  const storedDraft = localStorage.getItem(getDraftStorageKey(draftId, isPrivate));
  if (!storedDraft) return null;

  if (!isPrivate) return JSON.parse(storedDraft);

  const encrypted = JSON.parse(storedDraft);
  if (encrypted.version !== 1 || !encrypted.iv || !encrypted.ciphertext) {
    throw new Error('Bản nháp riêng tư không đúng định dạng.');
  }

  const key = await importDraftKey(keyMaterial);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decodeBase64(encrypted.iv) },
    key,
    decodeBase64(encrypted.ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export async function saveNoteDraft(draftId, draft, { isPrivate = false, keyMaterial } = {}) {
  const storageKey = getDraftStorageKey(draftId, isPrivate);
  if (!isPrivate) {
    localStorage.setItem(storageKey, JSON.stringify(draft));
    return;
  }

  const key = await importDraftKey(keyMaterial);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(draft))
  );
  localStorage.setItem(storageKey, JSON.stringify({
    version: 1,
    iv: encodeBase64(iv),
    ciphertext: encodeBase64(ciphertext),
  }));
}

export function deleteNoteDraft(draftId, { isPrivate = false } = {}) {
  localStorage.removeItem(getDraftStorageKey(draftId, isPrivate));
}
