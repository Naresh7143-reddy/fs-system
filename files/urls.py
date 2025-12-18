
from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_file, name='upload'),
    path('download/<uuid:file_id>/', views.download_page, name='download_page'),
path('download-file/<uuid:file_id>/', views.download_file, name='download_file'),
]