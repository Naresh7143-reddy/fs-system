async function handleUpload() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Select a file");
    return;
  }

  updateProgress(5); // encryption started

  const encrypted = await encryptFile(file);

  updateProgress(15); // encryption finished
  await uploadEncryptedFile(encrypted, file);
}

// 🔐 Encrypt file
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

// ⬆ REAL upload with progress
async function uploadEncryptedFile(data, file) {
  const formData = new FormData();

  formData.append("file", new Blob([data.encryptedBuffer]));
  formData.append("iv", arrayToBase64(data.iv));
  formData.append("original_name", file.name);
  formData.append("mime_type", file.type || "application/octet-stream");

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/files/upload/", true);
  xhr.setRequestHeader("X-CSRFToken", getCSRFToken());

  xhr.upload.onprogress = function (e) {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 85) + 15;
      updateProgress(percent);
    }
  };

  xhr.onload = function () {
    if (xhr.status === 200) {
      const result = JSON.parse(xhr.responseText);
      const keyBase64 = arrayToBase64(data.rawKey);

      const link =
        `${window.location.origin}/files/download/${result.file_id}/#${keyBase64}`;

      uploadComplete(link);
    } else {
      alert("Upload failed");
    }
  };

  xhr.send(formData);
}

// 🔁 Helpers
function arrayToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function getCSRFToken() {
  return document.cookie
    .split("; ")
    .find(r => r.startsWith("csrftoken="))
    ?.split("=")[1];
}
