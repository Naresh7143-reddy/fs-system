// ===============================
// GLOBAL
// ===============================
let DECRYPTED_BUFFER = null;

// ===============================
// MAIN FLOW
// ===============================
async function decryptAndDownload() {
  // 🔑 Get key from URL fragment
  const keyBase64 = window.location.hash.substring(1);
  if (!keyBase64) {
    alert("Missing key");
    return;
  }

  // 📌 Get file ID from query string
  const fileId = getFileId();
  if (!fileId) {
    alert("Missing file ID");
    return;
  }

  const keyBytes = base64ToArray(keyBase64);

  // 🔽 Fetch encrypted file
  const response = await fetch(`/files/download-file/${fileId}/`);
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

  // store for viewers
  DECRYPTED_BUFFER = decryptedBuffer;

  // 🔥 ALWAYS DOWNLOAD
  const fileInfo = downloadDecryptedFile(decryptedBuffer);

  // 🎯 SHOW VIEWER BUTTONS CONDITIONALLY
  if (fileInfo.type === "image") {
    document.getElementById("imageBtn").style.display = "inline-block";
  }

  if (fileInfo.type === "pdf") {
    document.getElementById("pdfBtn").style.display = "inline-block";
  }

  if (fileInfo.type === "doc") {
    document.getElementById("docBtn").style.display = "inline-block";
  }
}

// ===============================
// DOWNLOAD (ALWAYS)
// ===============================
function downloadDecryptedFile(buffer) {
  const fileInfo = detectFileType(buffer);

  const blob = new Blob([buffer], { type: fileInfo.mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "decrypted_file.txt"; // extension not important
  document.body.appendChild(a);
  a.click();

  URL.revokeObjectURL(url);
  a.remove();

  return fileInfo;
}

// ===============================
// VIEWERS
// ===============================
function viewImage() {
  if (!DECRYPTED_BUFFER) {
    alert("Download first");
    return;
  }

  const info = detectFileType(DECRYPTED_BUFFER);
  const blob = new Blob([DECRYPTED_BUFFER], { type: info.mime });
  const url = URL.createObjectURL(blob);

  const img = document.createElement("img");
  img.src = url;
  img.style.maxWidth = "100%";
  img.style.border = "2px solid #333";

  const output = document.getElementById("output");
  output.innerHTML = "";
  output.appendChild(img);
}

function viewPDF() {
  if (!DECRYPTED_BUFFER) {
    alert("Download first");
    return;
  }

  const blob = new Blob([DECRYPTED_BUFFER], {
    type: "application/pdf"
  });
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.width = "100%";
  iframe.height = "600px";

  const output = document.getElementById("output");
  output.innerHTML = "";
  output.appendChild(iframe);
}

function viewDOC() {
  alert(
    "Document downloaded. Open it using Google Docs or Microsoft Word."
  );
}

// ===============================
// CRYPTO
// ===============================
async function decryptFile(encryptedBuffer, keyBytes, iv) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    "AES-GCM",
    false,
    ["decrypt"]
  );

  return crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedBuffer
  );
}

// ===============================
// HELPERS
// ===============================
function detectFileType(buffer) {
  const bytes = new Uint8Array(buffer);

  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    return { type: "image", mime: "image/png" };
  }

  // JPEG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
    return { type: "image", mime: "image/jpeg" };
  }

  // PDF
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return { type: "pdf", mime: "application/pdf" };
  }

  // DOCX (ZIP)
  if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
    return { type: "doc", mime: "application/octet-stream" };
  }

  return { type: "unknown", mime: "application/octet-stream" };
}

function base64ToArray(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getFileId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("file");
}
