from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required()
def home(request):
    """
    Controller for the app home page.
    """
    context = {}

    return render(request, 'mttop_mining/home.html', context)

def TechDoc(request):
    """
    Controller for the app home page.
    """
    context = {}

    return render(request, 'mttop_mining/TechDoc.html', context)

def HelpFile(request):
    """
    Controller for the app home page.
    """
    context = {}

    return render(request, 'mttop_mining/HelpFile.html', context)