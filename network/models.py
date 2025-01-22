from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    def nbFollowers(self):
        return Follow.objects.filter(followed=self).count()

    def posts(self):
        return Post.objects.filter(user=self)
    
class Post(models.Model):
    likes = models.IntegerField(default=0)
    image = models.ImageField(upload_to='images/', blank=True, null=True)
    date = models.DateTimeField(auto_now_add=True)
    text = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_user')
    userLike = models.ManyToManyField(User, related_name='liked_posts', blank=True)


    def nbLikes(self):
        return self.userLike.count()
    
    def serialize(self):
        return {
            "id": self.id,
            "likes": self.likes,
            "image": self.image.url if self.image else None,
            "date": self.date.strftime("%Y-%m-%d %H:%M:%S"),
            "text": self.text,
            "user": {
                "id": self.user.id,
                "username": self.user.username,
            },
            "comments": [
                {
                    "user": comment.user.username,
                    "comment": comment.comment,
                    "date": comment.date.strftime("%Y-%m-%d %H:%M:%S"),
                }
                for comment in self.post_comment.all()
            ]
        }
    
class Comment(models.Model):
    comment = models.TextField()
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='post_comment')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_comment')
    date = models.DateTimeField(auto_now_add=True)

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='follower')
    followed = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followed')