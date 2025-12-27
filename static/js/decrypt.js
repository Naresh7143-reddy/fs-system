async function startDownload() {
  const keyBase64 = window.location.hash.substring(1);
  if (!keyBase64) {
    alert("Missing decryption key");
    return;
  }

  const keyBytes = base64ToArray(keyBase64);

  const response = await fetch(`/files/download-file/${FILE_ID}/`);
  if (!response.ok) {
    alert("File not found");
    return;
  }

  const iv = base64ToArray(response.headers.get("X-IV"));
  const filename = response.headers.get("X-FILENAME") || "file";
  const mimeType =
    response.headers.get("X-MIMETYPE") || "application/octet-stream";

  const encryptedBuffer = await response.arrayBuffer();

  const decryptedBuffer = await decryptFile(
    encryptedBuffer,
    keyBytes,
    iv
  );

  const blob = new Blob([decryptedBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  URL.revokeObjectURL(url);
  a.remove();
}

async function decryptFile(buffer, keyBytes, iv) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    "AES-GCM",
    false,
    ["decrypt"]
  );

  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, buffer);
}

function base64ToArray(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
