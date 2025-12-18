async function startDownload() {
  // 🔑 Get key from URL fragment
  const keyBase64 = window.location.hash.substring(1);
  if (!keyBase64) {
    alert("Missing decryption key");
    return;
  }

  const keyBytes = base64ToArray(keyBase64);

  // 🔽 Fetch encrypted file
  const response = await fetch(`/files/download-file/${FILE_ID}/`);
  if (!response.ok) {
    alert("File not found");
    return;
  }

  const ivBase64 = response.headers.get("X-IV");
  const encryptedBuffer = await response.arrayBuffer();

  const iv = base64ToArray(ivBase64);

  // 🔓 Decrypt
  const decryptedBuffer = await decryptFile(
    encryptedBuffer,
    keyBytes,
    iv
  );

  // 💾 Save file
  downloadDecryptedFile(decryptedBuffer);
}
async function decryptFile(encryptedBuffer, keyBytes, iv) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    "AES-GCM",
    false,
    ["decrypt"]
  );

  return await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedBuffer
  );
}
function downloadDecryptedFile(buffer) {
  const blob = new Blob([buffer]);
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "decrypted_file";
  document.body.appendChild(a);
  a.click();

  URL.revokeObjectURL(url);
  a.remove();
}
function base64ToArray(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}