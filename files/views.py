from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, FileResponse
from .models import EncryptedFile

@login_required
def upload_file(request):
    if request.method == "GET":
        return render(request, "upload.html")

    if request.method == "POST":
        obj = EncryptedFile.objects.create(
            owner=request.user,
            file=request.FILES["file"],
            iv=request.POST.get("iv", ""),
            original_name=request.POST.get("original_name", "file"),
            mime_type=request.POST.get("mime_type", "application/octet-stream"),
        )
        return JsonResponse({"file_id": str(obj.id)})


def download_file(request, file_id):
    obj = get_object_or_404(EncryptedFile, id=file_id)

    response = FileResponse(obj.file, as_attachment=False)
    response["X-IV"] = obj.iv
    response["X-FILENAME"] = obj.original_name
    response["X-MIMETYPE"] = obj.mime_type

    return response


def download_page(request, file_id):
    return render(request, "download.html", {"file_id": file_id})
