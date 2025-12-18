# files/views.py
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .models import EncryptedFile
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.http import JsonResponse

@login_required
def upload_file(request):
    if request.method == "GET":
        return render(request, "upload.html")

    if request.method == "POST":
        obj = EncryptedFile.objects.create(
            owner=request.user,
            file=request.FILES["file"],
            iv=request.POST["iv"]
        )
        return JsonResponse({"file_id": str(obj.id)})   

from django.shortcuts import get_object_or_404, render
from django.http import FileResponse
from .models import EncryptedFile

def download_file(request, file_id):
    obj = get_object_or_404(EncryptedFile, id=file_id)

    response = FileResponse(obj.file, as_attachment=False)
    response['X-IV'] = obj.iv   # send IV in header
    return response


def download_page(request, file_id):
    return render(request, 'download.html', {
        'file_id': file_id
    })
