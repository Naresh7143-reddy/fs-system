# files/models.py
import uuid
from django.db import models
from django.conf import settings

def encrypted_upload_path(instance, filename):
    # ignore original filename completely
    return f"encrypted_files/{uuid.uuid4().hex}.bin"

class EncryptedFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file = models.FileField(upload_to=encrypted_upload_path)
    iv = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
