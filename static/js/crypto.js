async function handleUpload() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return alert("Select a file");

  const encrypted = await encryptFile(file);
  await uploadEncryptedFile(encrypted, file);
}

async function encryptFile(file) {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buffer = await file.arrayBuffer();

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    buffer
  );

  const rawKey = await crypto.subtle.exportKey("raw", key);
  return { encryptedBuffer, iv, rawKey };
}

async function uploadEncryptedFile(data, file) {
  const formData = new FormData();

  formData.append("file", new Blob([data.encryptedBuffer]));
  formData.append("iv", arrayToBase64(data.iv));
  formData.append("original_name", file.name);
  formData.append("mime_type", file.type || "application/octet-stream");

  const res = await fetch("/files/upload/", {
    method: "POST",
    body: formData,
    headers: { "X-CSRFToken": getCSRFToken() },
  });

  const result = await res.json();
  const keyBase64 = arrayToBase64(data.rawKey);

  const link =
    `${window.location.origin}/files/download/${result.file_id}/#${keyBase64}`;

  document.getElementById("shareLink").value = link;
  document.getElementById("shareSection").style.display = "block";
}

function arrayToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function getCSRFToken() {
  return document.cookie
    .split("; ")
    .find(r => r.startsWith("csrftoken="))
    ?.split("=")[1];
}
