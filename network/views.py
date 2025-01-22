from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from .models import User, Post, Follow, Comment
from django.contrib.auth.decorators import login_required
from .forms import CreatePost 
from django.db.models import F
from django.core.paginator import Paginator


def index(request):
    return render(request, "network/index.html")

def posting(request):
    try:
        posts = Post.objects.order_by("-date").all()
        
        paginator = Paginator(posts, 10)
        page_number = request.GET.get('page', 1)  # Default to page 1 if not specified
        
        try:
            page_obj = paginator.get_page(page_number)
        except Exception as e:
            page_obj = paginator.get_page(1)  # Fallback to first page if there's an error
        
        data = {
            'posts': [post.serialize() for post in page_obj.object_list],
            'page_number_selected': int(page_obj.number),  # Current page number
            'isPreviousPage': page_obj.has_previous(),
            'isNextPage': page_obj.has_next(),
            'num_page': paginator.num_pages
        }
        
        return JsonResponse(data)
    except Exception as e:
        # Log the error for debugging
        print(f"Error in posting view: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@login_required
def create_post(request):
    if request.method == "POST":
        form = CreatePost(request.POST, request.FILES)
        if form.is_valid():
            post = form.save(commit=False)
            post.user = request.user
            post.save()
            return JsonResponse({"message": "Post sent successfully."}, status=201)
        else:
            return JsonResponse({"message": "Post sent incorrectly."}, status=400)
    else:
        form = CreatePost()
    return render(request, "network/post.html", {"form": form})
        

@login_required
def addLike(request, post_id):
    if request.method == "POST":
        try:
            post = Post.objects.get(pk=post_id)
            if request.user in post.userLike.all():
                post.userLike.remove(request.user)
                Post.objects.filter(pk=post_id).update(likes=F('likes') - 1)
            else:
                post.userLike.add(request.user)
                Post.objects.filter(pk=post_id).update(likes=F('likes') + 1)
            
            post.refresh_from_db()
            return JsonResponse({"message": "Sent like successfully.", "likes": post.likes}, status=200)
        except Post.DoesNotExist:
            return JsonResponse({"error": "Post not found"}, status=404)
    return JsonResponse({"error": "Invalid request method"}, status=400)
    
@login_required
def addComment(request, post_id):
    if request.method == "POST":
        text_comment = request.POST.get("text-comment")
        if text_comment:
            post = Post.objects.get(pk=post_id)
            user = request.user
            comment = Comment.objects.create(
                post=post,
                user=user,
                comment=text_comment
            )

            return JsonResponse({
                'username': comment.user.username,
                'comment': comment.comment,
                'date': comment.date.strftime('%B %d, %Y, %I:%M %p')
            })
        else:
            return JsonResponse({"error": "No text found!"}, status=400)
        

def profile(request, user_id):
    if request.method == "GET":
        user = User.objects.get(pk=user_id)
        followers = user.nbFollowers()
        posts = user.posts()

        isFollowing = Follow.objects.filter(follower=request.user, followed=user).exists()


        paginator = Paginator(posts, 10)
        page_number_seleted = request.GET.get('page')
        page_obj = paginator.get_page(page_number_seleted)
        isPreviousPage = page_obj.has_previous()
        isNextPage = page_obj.has_next()

        return render(request, "network/profile.html", {
            "page_obj": page_obj,
            "user": user,
            "followers": followers,
            "posts": posts,
            "followed": request.user in user.follower.all(),
            "paginator": paginator,
            "isPreviousPage": isPreviousPage,
            "isNextPage": isNextPage,
            "is_following": isFollowing
        })

@login_required
def follow(request, user_id):
    if request.method == "POST":
        user = User.objects.get(pk=user_id)

        if (user == request.user):
            return JsonResponse({
                "error": "You cannot follow yourself",
                "followers": user.nbFollowers(),
                "isFollowing": False
            }, status=400) 
        
    isFollowing = Follow.objects.filter(
        follower=request.user,
        followed=user
    ).first()
    if isFollowing:
        isFollowing.delete()
        isNowFollowing = False
    else:
        Follow.objects.create(
            follower=request.user,
            followed=user
        )
        isNowFollowing = True

    return JsonResponse({
            "followers": user.nbFollowers(),
            "isFollowing": isNowFollowing,
        })

@login_required
def following(request):
    user = request.user
    user_followings = Follow.objects.filter(follower=user)
    posts = []
    for user_following in  user_followings:
        posts.extend(Post.objects.filter(user=user_following.followed))

    posts.sort(key=lambda post: post.date)

    try:
        
        paginator = Paginator(posts, 10)
        page_number = request.GET.get('page', 1)
        
        try:
            page_obj = paginator.get_page(page_number)
        except Exception as e:
            page_obj = paginator.get_page(1)
        
        data = {
            'posts': [post.serialize() for post in page_obj.object_list],
            'page_number_selected': int(page_obj.number),
            'isPreviousPage': page_obj.has_previous(),
            'isNextPage': page_obj.has_next(),
            'num_page': paginator.num_pages
        }
        
        return JsonResponse(data)
    except Exception as e:
        # Log the error for debugging
        print(f"Error in posting view: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
    
