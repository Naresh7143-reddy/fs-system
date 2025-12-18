from django.shortcuts import render

def image_viewer(request):
    return render(request, "viewer/image_viewer.html")
