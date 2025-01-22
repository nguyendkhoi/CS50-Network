document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    const index = document.querySelector('#index')
    const following = document.querySelector('#following')
    const postForm =  document.querySelector('#post-form')
    const followBtn = document.querySelector('#un-follow-btn')

    if(index) {
        index.addEventListener('click', () => load_data('index'));
    }

    if (following) {
        following.addEventListener('click', (event) => {
            event.preventDefault();
            load_data("following");
        });
    }

    if (followBtn) {
        followBtn.addEventListener('click', () => {
            const userId = followBtn.dataset.userId;
            handleFollow(userId);
        });
    }

    if (postForm) {
        postForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formdata = new FormData(e.target);
            fetch("create-post", {
                method: 'POST',
                body: formdata
            })
            .then(response => response.json())
            .then(data => {
                if(data.message === "Post sent successfully.") {
                    window.location.href = '/';
                }
            })
        });
    }

    // By default, load the index
    if (window.location.pathname === '/') {
        load_data('index');
      };
});

function handleFollow(userId) {
    const csrftoken = getCookie('csrftoken')
    fetch(`/user/${userId}/follow`, {
        method: "POST",
        headers: {'X-CSRFToken': csrftoken},
        mode: 'same-origin',
    })
        .then(response => response.json())
        .then(data => {
            if(data.error) {
                alert(data.error);
                return;
            }
            const followBtn = document.querySelector('#un-follow-btn');
            if(followBtn) {
                followBtn.textContent = data.isFollowing ? "Unfollow" : "Follow";
                const followers = document.getElementById("followers");
                if (followers) {
                    followers.innerHTML = `<p>${data.followers } followers </p>`;
                }
            }
        })
        .catch(err => {
            console.log("error", err)
        })
}


function load_data(type, page = 1) {
    console.log("type:", type);
    let url;
    if (type == "index") {
        url = `/post?page=${page}`
    } else if (type == "following") {
        url = "/following?page=${page}"
    } else {
        return
    }
    console.log("url: ", url)
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("posts:", data.posts);
            const postsContainer = document.querySelector("#postsContainer");
            const container = document.querySelector(".container");
            if(postsContainer) {
                postsContainer.innerHTML = '';
            }
            data.posts.forEach(post => {
                console.log(`${post.text}`);
                const p = document.createElement('li');
                p.classList.add("list-group-item", "border-1", "my-2"); 
                
                let postContent = `
                <p><i class="fa-solid fa-user"></i> <a href="/user/${post.user.id}" class="link-dark link-opacity-50 link-underline-opacity-0 link-opacity-100-hover link-underline-opacity-100-hover">${post.user.username}</a></p>
                <p class="fs-4">${post.text}</p>
                ${post.image ? `
                        <div class="post-image">
                            <img src="${post.image}" alt="Post image" class="img-fluid">
                        </div>` : ''}
                <small class="text-muted">posted at: ${post.date}</small>
                <p><i class="fa-solid fa-heart"></i> <span id="like-post-${post.id}">${post.likes || 0}</span></p>
                `;

                postContent += `
                    <h5 class="mt-3 mb-2">Comments:</h5>
                    <ul class="list-group" id="comment-post-${post.id}">
                        ${post.comments.map(comment => `
                            <li class="list-group-item border-1 p-1">
                                <div class="comment">
                                    <small class="text-muted"><i class="fa-solid fa-user"></i> ${comment.user}</small>
                                    <p class="mb-1">${comment.comment}</p>
                                    <small class="text-muted">at ${comment.date}</small>
                                </div>
                            </li>
                        `).join('')}
                  </ul>
                `;

                const buttonContainer = document.createElement('div');
                buttonContainer.classList.add("my-3");
                const likeBtn = document.createElement("button");
                const commentBtn = document.createElement("button");
                likeBtn.textContent = "Like";
                likeBtn.classList.add("btn", "btn-outline-secondary", "me-2");
                commentBtn.textContent="Comment";
                commentBtn.classList.add("btn", "btn-outline-secondary");
                likeBtn.addEventListener("click", function() {
                    addLike(post.id)
                });
                commentBtn.addEventListener("click", function() {
                    commentBtn.disabled = true;
                    const form = document.createElement('form');
                    const input = document.createElement('textarea');
                    input.autofocus = true;
                    input.classList.add("form-control", "mb-2", "mt-3");
                    input.rows = 2;
                    input.name = "text-comment";
                    input.placeholder = "Write your comment...."

                    const submitComment = document.createElement('button');
                    submitComment.type = "submit";
                    submitComment.textContent = "Comment";
                    submitComment.classList.add("btn", "btn-outline-primary", "mr-2");
                    
                    const cancelBtn = document.createElement('button');
                    cancelBtn.classList.add("btn", "btn-outline-danger");
                    cancelBtn.textContent = "Cancel";
                    cancelBtn.addEventListener("click", function() {
                        form.remove()
                        commentBtn.disabled = false;
                    })

                    form.appendChild(input);
                    form.appendChild(submitComment);
                    form.appendChild(cancelBtn);

                    form.addEventListener("submit", function(event) {
                        event.preventDefault();
                        addNewComment(event, post.id)
                            .then(() => {
                                form.remove();
                                commentBtn.disabled = false;
                                input.value = '';
                            });
                    });
                    p.appendChild(form);
                });
                buttonContainer.append(likeBtn, commentBtn);
                
                p.innerHTML = postContent;
                p.appendChild(buttonContainer); 
                postsContainer.appendChild(p);
            });
            addPagination(type, container, data.page_number_selected, data.isPreviousPage, data.isNextPage, data.num_page); 
        })
        .catch(error => console.error('Error:', error));
};

function addPagination(type, container, page_number_selected, isPreviousPage, isNextPage, num_page) {

    const oldPagination = container.querySelector('nav.pagination');
    if (oldPagination) {
        oldPagination.remove();
    }

    const currentPage = parseInt(page_number_selected) || 1;

    const pagination = document.createElement('nav');
    pagination.classList.add("pagination", "justify-content-center");
    pagination.ariaLabel = "Post navigation";

    const ul = document.createElement('ul');
    ul.classList.add("pagination");
    pagination.appendChild(ul);

    // Previous button
    const previousPageButton = document.createElement('li');
    previousPageButton.classList.add("page-item");
    if (!isPreviousPage) {
        previousPageButton.classList.add("disabled");
    }
    const previousPageLink = document.createElement('a');
    previousPageLink.classList.add("page-link");
    previousPageLink.addEventListener("click", (e) => {
        e.preventDefault();
        load_data(type, currentPage - 1)
    });
    previousPageLink.innerHTML = "<span aria-hidden=\"true\">&laquo;</span>";
    previousPageButton.appendChild(previousPageLink);
    ul.appendChild(previousPageButton);

    // Page numbers
    for (let i = 1; i <= num_page; i++) {
        const pageItem = document.createElement('li');
        pageItem.classList.add("page-item");
        if (i === currentPage) {
            pageItem.classList.add("active");
        }
        const pageLink = document.createElement('a');
        pageLink.classList.add("page-link");
        pageLink.addEventListener("click", (e) => {
            e.preventDefault();
            load_data(type, i)
        });
        pageLink.textContent = i;
        pageItem.appendChild(pageLink);
        ul.appendChild(pageItem);
    }

    // Next button
    const nextPageButton = document.createElement('li');
    nextPageButton.classList.add("page-item");
    if (!isNextPage) {
        nextPageButton.classList.add("disabled");
    }
    const nextPageLink = document.createElement('a');
    nextPageLink.classList.add("page-link");
    nextPageLink.addEventListener("click", (e) => {
        e.preventDefault();
        load_data(type, currentPage + 1)
    });
    nextPageLink.innerHTML = "<span aria-hidden=\"true\">&raquo;</span>";
    nextPageButton.appendChild(nextPageLink);
    ul.appendChild(nextPageButton);

    container.appendChild(pagination);

}

function addLike(post_id) {
    const csrftoken = getCookie('csrftoken');
    fetch(`/post/${post_id}/like`, {
        method: "POST",
        headers: {'X-CSRFToken': csrftoken},
        mode: 'same-origin'
    })
    .then((response) => response.json())
    .then((data) => {
        const likePost = document.querySelector(`#like-post-${post_id}`);
        if (likePost) {
            likePost.textContent = data.likes;
        }
    })
    .catch((error) => {
        console.error("Error liking post:", error);
    });
}

function addNewComment(e, post_id) {
    const csrftoken = getCookie('csrftoken');
    const formdata = new FormData(e.target);
    return fetch(`/post/${post_id}/comment`, {
        method: "POST",
        headers: {'X-CSRFToken': csrftoken},
        mode: 'same-origin', // Do not send CSRF token to another domain.
        body: formdata,
    })
    .then((response) => response.json())
    .then((comment) => {
        const commentContainer = document.querySelector(`#comment-post-${post_id}`);
        const a = document.createElement("li");
        a.classList.add("list-group-item");
        a.innerHTML = `
        <p>user: ${comment.username}</p>
        <p>${comment.comment}</p>
        <small class="text-muted">${comment.date}</small>`
        commentContainer.appendChild(a);
    })
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

