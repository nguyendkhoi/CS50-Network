# Network

This project is a Twitter-like social network where users can post text and image content, follow other users, like posts, and comment on posts. It's built using Django on the backend and plain JavaScript on the frontend.

## Features

-   **User Authentication:**
    -   Users can register with a username, email, and password.
    -   Users can log in and log out securely.
-   **Post Creation:**
    -   Users can create new posts containing text and/or an image.
    -   Posts are displayed with the author's username, post content, image (if any), timestamp, and like count.
-   **Profile Pages:**
    -   Each user has a profile page that displays their posts, follower count.
    -   Users can follow/unfollow other users from their profile page.
-   **Following Feed:**
    -   Users can view a feed of posts from the users they follow, sorted chronologically.
-   **Liking:**
    -   Users can like or unlike posts.
    -   The number of likes is displayed on each post.
-   **Commenting:**
    -   Users can comment on posts.
    -   Comments are displayed with the commenter's username, comment text, and timestamp.
- **Pagination:**
    - Posts on the index and following feeds are paginated, displaying 10 posts per page.
    - Users can navigate between pages using pagination controls.

## Technologies Used

-   **Backend:**
    -   Django web framework
    -   Django REST Framework (for API endpoints)
    -   SQLite database
-   **Frontend:**
    -   JavaScript (vanilla, no frameworks)
    -   HTML
    -   CSS (Bootstrap for styling)
    -   Font Awesome (for icons)

## Project Structure

-   `models.py`: Defines the database models for Users, Posts, Comments, and Follows.
-   `views.py`: Contains the logic for handling requests, interacting with the models, and rendering responses.
-   `urls.py`: Defines the URL routing for the application.
-   `forms.py`: Defines the Django form for creating new posts.
-   `static/network/index.js`: Contains the frontend JavaScript logic for handling user interactions, making API requests, and updating the UI.
-   `templates/network/`: Contains the HTML templates for rendering the different pages of the application.

## API Endpoints

-   `/` (GET): Renders the index page.
-   `/post` (GET): Retrieves a paginated list of all posts (for the index page).
-   `/create-post` (POST): Creates a new post.
-   `/post/<int:post_id>/like` (POST): Adds or removes a like from a post.
-   `/post/<int:post_id>/comment` (POST): Adds a comment to a post.
-   `/user/<int:user_id>` (GET): Renders the profile page for a user.
-   `/user/<int:user_id>/follow` (POST): Follows or unfollows a user.
-   `/following` (GET): Retrieves a paginated list of posts from followed users.
-   `/login` (GET/POST): Handles user login.
-   `/logout` (GET): Handles user logout.
-   `/register` (GET/POST): Handles user registration.

## JavaScript Functions

-   `load_data(type, page)`: Fetches posts from the appropriate API endpoint based on the `type` (index or following) and `page` number, and updates the UI with the retrieved posts.
-   `handleFollow(userId)`: Sends a request to follow/unfollow a user and updates the UI accordingly.
-   `addPagination(type, container, page_number_selected, isPreviousPage, isNextPage, num_page)`: Creates and appends pagination controls to the specified container.
-   `addLike(post_id)`: Sends a request to like/unlike a post and updates the like count in the UI.
-   `addNewComment(e, post_id)`: Sends a request to add a comment to a post and updates the UI with the new comment.
-   `getCookie(name)`: Retrieves the value of a cookie by its name (used for CSRF token).