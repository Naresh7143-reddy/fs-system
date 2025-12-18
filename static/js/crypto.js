async function handleUpload() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Select a file");
    return;
  }

  const encryptedData = await encryptFile(file);
  await uploadEncryptedFile(encryptedData, file.name);
}
async function encryptFile(file) {
  // Generate AES-256 key
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // Random IV (12 bytes recommended)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Read file as buffer
  const fileBuffer = await file.arrayBuffer();

  // Encrypt file
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    fileBuffer
  );

  // Export key (raw bytes)
  const rawKey = await crypto.subtle.exportKey("raw", key);

  return {
    encryptedBuffer,
    iv,
    rawKey
  };
}
async function uploadEncryptedFile(data, filename) {
  const formData = new FormData();

  // Convert encrypted buffer to Blob
  const encryptedBlob = new Blob([data.encryptedBuffer]);

  formData.append("file", encryptedBlob, filename + ".enc");
  formData.append("iv", arrayToBase64(data.iv));

  const response = await fetch("/files/upload/", {
    method: "POST",
    body: formData,
    headers: {
      "X-CSRFToken": getCSRFToken()
    }
  });

  const result = await response.json();

  generateShareLink(result.file_id, data.rawKey);
}
function getCSRFToken() {
  return document.cookie
    .split("; ")
    .find(row => row.startsWith("csrftoken"))
    ?.split("=")[1];
}
function generateShareLink(fileId, rawKey) {
  const keyBase64 = arrayToBase64(rawKey);

  const link =
    `${window.location.origin}/viewer/image/?file=${fileId}#${keyBase64}`;

  document.getElementById("shareLink").value = link;
  document.getElementById("shareSection").style.display = "block";
}
function arrayToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}
function copyLink() {
  const input = document.getElementById("shareLink");
  input.select();
  input.setSelectionRange(0, 99999); // mobile support
  navigator.clipboard.writeText(input.value);
  alert("Link copied!");
}
