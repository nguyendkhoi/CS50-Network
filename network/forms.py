from django import forms
from .models import Post

class CreatePost(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['text', 'image']
        widgets = {
            'text': forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'What do you feel today?'}),
            'image': forms.FileInput(attrs={'class': 'form-control'}),
        }
        labels = {
            'text': '',
        }