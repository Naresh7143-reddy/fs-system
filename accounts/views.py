from django.shortcuts import render, redirect
from django.http import HttpResponse
from .models import User
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout

# Create your views here.
def home(request):
    return render(request, "home.html")
from django.shortcuts import render, redirect
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()

def signup_view(request):
    if request.method == "POST":
        email = request.POST.get("email")
        phone = request.POST.get("phone")
        password = request.POST.get("password")
        confirm_password = request.POST.get("confirm_password")

        if password != confirm_password:
            return render(request, "signup.html", {
                "error": "Passwords do not match"
            })

        if User.objects.filter(email=email).exists():
            return render(request, "signup.html", {
                "error": "Email already registered"
            })

        if User.objects.filter(phone=phone).exists():
            return render(request, "signup.html", {
                "error": "Phone number already registered"
            })

        try:
            User.objects.create_user(
                email=email,
                phone=phone,
                password=password
            )
        except IntegrityError:
            # absolute safety net
            return render(request, "signup.html", {
                "error": "Email or phone already exists"
            })

        return redirect("login")

    return render(request, "signup.html")

def login_view (request):
    if request.method == 'POST':
        email=request.POST.get('email')
        password=request.POST.get('password')
        user=authenticate(request,email=email,password=password)
        if user is not None:
            login(request,user)
            return redirect('home')
        else:
            messages.error(request,"Invalid credentials")
            return redirect('login')
    return render (request,'login.html')
def logout_view (request):
    logout(request)
    return HttpResponse("Logged out successfully")