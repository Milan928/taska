// base url
var API_URL = 'https://localhost:3000/api';

// storing jwt token in local storage of web so that user can stay logged in after refreshing the page
var token       = localStorage.getItem('tf_token') || '';
var currentUser = JSON.parse(localStorage.getItem('tf_user') || 'null');
var allTasks    = [];
var activeFilter = 'all';

// Turn off jQuery Mobile's built-in AJAX navigation to handle the routing manually
$(document).on('mobileinit', function() {
    $.mobile.ajaxEnabled          = false;
    $.mobile.linkBindingEnabled   = true;
    $.mobile.hashListeningEnabled = true;
    $.mobile.pushStateEnabled     = false;
});


// Show a brief toast message at the bottom of the screen
function showToast(message, type) {
    var $toast = $('#toast-msg');
    $toast.text(message).removeClass('success danger').addClass('show');
    if (type) $toast.addClass(type);
    setTimeout(function() {
        $toast.removeClass('show success danger');
    }, 2600);
}

// Show an error message inside a form
function showError(elementId, message) {
    $(elementId).text(message).show();
}

// Hide and clear an error message
function hideError(elementId) {
    $(elementId).text('').hide();
}

// Format a date like "15 Jan 2025"
function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-AU', {
        day:   'numeric',
        month: 'short',
        year:  'numeric'
    });
}

// Convert a date to the YYYY-MM-DD format that date inputs need
function toDateInputValue(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
}

// Check if a due date has already passed
function isPastDue(dateString) {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
}

// Set the selected state on a priority picker
function selectPriority(pickerId, value) {
    $('#' + pickerId + ' .prio-opt').removeClass('prio-selected');
    $('#' + pickerId + ' .prio-opt[data-value="' + value + '"]').addClass('prio-selected');
}

// resualble api request helper
function apiRequest(method, path, data, onSuccess, onError) {
    console.log(API_URL+path);
    var requestOptions = {
        url:         API_URL + path,
        type:        method,
        contentType: 'application/json',
        success:     onSuccess,
        error: function(res) {
            var message = 'Something went wrong. Is the server running?';
            try {
                var response = JSON.parse(res.responseText);
                if (response.error) message = response.error;
            } catch (e) {
                onError(message);
                return;
            }

           onError(message);
        }
    };

    // adding Authorization header 
    if (token) {
        requestOptions.headers = { Authorization: 'Bearer ' + token };
    }

    // add body in data
    if (data) {
        requestOptions.data = JSON.stringify(data);
    }

    $.ajax(requestOptions);
}


// store the token and user info after a successful login/signup
function saveAuthData(responseData) {
    token       = responseData.token;
    currentUser = responseData.user;
    localStorage.setItem('tf_token', token);
    localStorage.setItem('tf_user', JSON.stringify(currentUser));
}

// Clear everything on logout
function clearAuthData() {
    token       = '';
    currentUser = null;
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
}



// handling login api

$(document).on('click', '#btn-login', function() {
    console.log("login");
    hideError('#login-error');

    var email    = $('#login-email').val().trim();
    var password = $('#login-password').val();

    if (!email || !password) {
        showError('#login-error', 'Please enter your email and password.');
        return;
    }

    var $button = $(this);
    $button.text('Signing in...').prop('disabled', true);

    apiRequest('POST', '/auth/login', { email: email, password: password },
        function(data) {
            saveAuthData(data);
            $button.text('Sign In').prop('disabled', false);
            $('#login-password').val('');
            $.mobile.navigate('#page-home');
        },
        function(errorMessage) {
            showError('#login-error', errorMessage);
            $button.text('Sign In').prop('disabled', false);
        }
    );
});

// navigating sign up page
$(document).on('click', '#go-signup', function() {
    $.mobile.navigate('#page-signup');
});



// handling signup api

$(document).on('click', '#btn-signup', function() {
    hideError('#signup-error');

    var name     = $('#signup-name').val().trim();
    var email    = $('#signup-email').val().trim();
    var password = $('#signup-password').val();

    if (!name || !email || !password) {
        showError('#signup-error', 'All fields are required.');
        return;
    }

    var $button = $(this);
    $button.text('Creating...').prop('disabled', true);

    apiRequest('POST', '/auth/signup', { name: name, email: email, password: password },
        function(data) {
            saveAuthData(data);
            $button.text('Create Account').prop('disabled', false);
            $.mobile.navigate('#page-home');
        },
        function(errorMessage) {
            showError('#signup-error', errorMessage);
            $button.text('Create Account').prop('disabled', false);
        }
    );
});



// handling logout api

$(document).on('click', '#btn-logout', function() {
    // Tell the server we're logging out (good practice, even though JWT is stateless)
    apiRequest('POST', '/auth/logout', null, function() {}, function() {});

    clearAuthData();
    allTasks = [];
    $.mobile.navigate('#page-login');
    showToast('Logged out.');
});




// loading home page

$(document).on('pageshow', '#page-home', function() {
    // If not logged in, redirect to login
    if (!token) {
        $.mobile.navigate('#page-login');
        return;
    }

    // Show first name in the greeting
    if (currentUser) {
        var firstName = currentUser.name.split(' ')[0];
        $('#greeting-name').text(firstName + ' 👋');
    }

    loadTasks();
});




// retrive tasks data
function loadTasks() {
    // Show loading spinner while fetching
    $('#task-list').html(
        '<div class="loading-state">' +
            '<div class="spinner"></div>' +
            '<p>Loading tasks...</p>' +
        '</div>'
    );
    $('#empty-state').hide();

    apiRequest('GET', '/tasks', null,
        function(tasks) {
            allTasks = tasks;
            renderTaskList(allTasks);
        },
        function(errorMessage) {
            $('#task-list').html(
                '<div class="loading-state"><p>⚠ ' + errorMessage + '</p></div>'
            );
        }
    );
}

// filters the task based on status
function filterTasks(tasks) {
    if (activeFilter === 'pending') return tasks.filter(function(t) { return !t.completed; });
    if (activeFilter === 'done')    return tasks.filter(function(t) { return t.completed; });
    if (activeFilter === 'high')    return tasks.filter(function(t) { return t.priority === 'high'; });
    return tasks;
}

function renderTaskList(tasks) {
    var visibleTasks = filterTasks(tasks);
    var $list        = $('#task-list').empty();

    var totalCount   = tasks.length;
    var doneCount    = tasks.filter(function(t) { return t.completed; }).length;
    var pendingCount = totalCount - doneCount;

    $('#stat-total').text(totalCount);
    $('#stat-pending').text(pendingCount);
    $('#stat-done').text(doneCount);

    // Update the progress bar
    var percentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    $('#progress-bar').css('width', percentage + '%');
    $('#progress-label').text(percentage + '%');

    // Show empty state if no tasks match the current filter
    if (visibleTasks.length === 0) {
        $('#empty-state').show();
        return;
    }

    $('#empty-state').hide();

    // Build a card for each task
    visibleTasks.forEach(function(task) {
        var cardHtml = buildTaskCard(task);
        $list.append(cardHtml);
    });
}

// Builds the HTML string for a single task card
function buildTaskCard(task) {
    var doneClass  = task.completed ? 'is-done' : '';
    var checkClass = task.completed ? 'checked' : '';

    // Build the priority tag
    var tags = '<span class="tag tag-' + task.priority + '">' + task.priority.toUpperCase() + '</span>';

    // Add category tag if it's not the default
    if (task.category && task.category !== 'General') {
        tags += '<span class="tag tag-cat">' + escapeHtml(task.category) + '</span>';
    }

    // Add due date tag if there is one
    if (task.dueDate) {
        var dueClass = (isPastDue(task.dueDate) && !task.completed) ? 'tag-overdue' : 'tag-due';
        tags += '<span class="tag ' + dueClass + '">📅 ' + formatDate(task.dueDate) + '</span>';
    }

    return (
        '<div class="task-card priority-' + task.priority + ' ' + doneClass + '" data-id="' + task._id + '">' +
            '<div class="task-top">' +
                '<div class="task-check ' + checkClass + '"></div>' +
                '<div class="task-title">' + escapeHtml(task.title) + '</div>' +
                '<div class="task-arrow">›</div>' +
            '</div>' +
            '<div class="task-tags">' + tags + '</div>' +
        '</div>'
    );
}

// Safely escape HTML to prevent XSS attacks
function escapeHtml(text) {
    return $('<div>').text(text).html();
}

// edit the tasks
$(document).on('click', '.task-check', function(event) {
    // Stop the click from also opening the edit page
    event.stopPropagation();

    var taskId      = $(this).closest('.task-card').data('id');
    var taskData    = allTasks.find(function(t) { return t._id === taskId; });

    if (!taskData) return;

    var newStatus = !taskData.completed;

    apiRequest('PUT', '/tasks/' + taskId, { completed: newStatus },
        function(updatedTask) {
            var index = allTasks.findIndex(function(t) { return t._id === taskId; });
            if (index > -1) allTasks[index] = updatedTask;
            renderTaskList(allTasks);
            showToast(newStatus ? '✓ Task completed!' : 'Marked as pending', newStatus ? 'success' : '');
        },
        function(errorMessage) {
            showToast(errorMessage, 'danger');
        }
    );
});


// edit tasks card
$(document).on('click', '.task-card', function() {
    var taskId   = $(this).data('id');
    var taskData = allTasks.find(function(t) { return t._id === taskId; });

    if (!taskData) return;

    fillEditForm(taskData);
    $.mobile.navigate('#page-edit-task');
});

// Fill the edit form with a task's current values
function fillEditForm(task) {
    hideError('#edit-error');
    $('#edit-id').val(task._id);
    $('#edit-title').val(task.title);
    $('#edit-description').val(task.description || '');
    $('#edit-category').val(task.category || '');
    $('#edit-due').val(toDateInputValue(task.dueDate));
    $('#edit-priority').val(task.priority || 'medium');
    $('#edit-completed').prop('checked', task.completed);

    selectPriority('edit-priority-picker', task.priority || 'medium');
}


// Reset the add form every time this page is opened
$(document).on('pageshow', '#page-add-task', function() {
    hideError('#add-error');
    $('#add-title, #add-description, #add-category').val('');
    $('#add-due').val('');
    $('#add-priority').val('medium');
    selectPriority('add-priority-picker', 'medium');
});

$(document).on('click', '#btn-add-task', function() {
    hideError('#add-error');

    var title = $('#add-title').val().trim();

    if (!title) {
        showError('#add-error', 'Please enter a task title.');
        return;
    }

    var $button = $(this);
    $button.text('Adding...').prop('disabled', true);

    var taskData = {
        title:       title,
        description: $('#add-description').val().trim(),
        category:    $('#add-category').val().trim() || 'General',
        priority:    $('#add-priority').val(),
        dueDate:     $('#add-due').val() || null
    };

    apiRequest('POST', '/tasks', taskData,
        function(newTask) {
            // Add the new task to the top of the list
            allTasks.unshift(newTask);

            $button.text('Add Task').prop('disabled', false);
            showToast('Task added! ✓', 'success');
            $.mobile.navigate('#page-home');
        },
        function(errorMessage) {
            showError('#add-error', errorMessage);
            $button.text('Add Task').prop('disabled', false);
        }
    );
});

// update tasks
$(document).on('click', '#btn-save-edit', function() {
    hideError('#edit-error');

    var taskId = $('#edit-id').val();
    var title  = $('#edit-title').val().trim();

    if (!title) {
        showError('#edit-error', 'Title cannot be empty.');
        return;
    }

    var $button = $(this);
    $button.text('Saving...').prop('disabled', true);

    var updates = {
        title:       title,
        description: $('#edit-description').val().trim(),
        category:    $('#edit-category').val().trim() || 'General',
        priority:    $('#edit-priority').val(),
        dueDate:     $('#edit-due').val() || null,
        completed:   $('#edit-completed').is(':checked')
    };

    apiRequest('PUT', '/tasks/' + taskId, updates,
        function(updatedTask) {
            var index = allTasks.findIndex(function(t) { return t._id === taskId; });
            if (index > -1) allTasks[index] = updatedTask;

            $button.text('Save Changes').prop('disabled', false);
            showToast('Task updated! ✓', 'success');
            $.mobile.navigate('#page-home');
        },
        function(errorMessage) {
            showError('#edit-error', errorMessage);
            $button.text('Save Changes').prop('disabled', false);
        }
    );
});

// delete task
$(document).on('click', '#btn-delete', function() {
    var confirmed = confirm('Are you sure you want to delete this task?');
    if (!confirmed) return;

    var taskId = $('#edit-id').val();

    apiRequest('DELETE', '/tasks/' + taskId, null,
        function() {
            allTasks = allTasks.filter(function(t) { return t._id !== taskId; });

            showToast('Task deleted.', 'danger');
            $.mobile.navigate('#page-home');
        },
        function(errorMessage) {
            showToast('Could not delete: ' + errorMessage, 'danger');
        }
    );
});

// handling priority picker click
$(document).on('click', '.prio-opt', function() {
    var selectedValue = $(this).data('value');
    var pickerId      = $(this).closest('.priority-picker').attr('id');
    var hiddenInputId = (pickerId === 'add-priority-picker') ? '#add-priority' : '#edit-priority';

    $(hiddenInputId).val(selectedValue);
    selectPriority(pickerId, selectedValue);
});

// handling filter buttons
$(document).on('click', '.filter-btn', function() {
    $('.filter-btn').removeClass('active');
    $(this).addClass('active');
    activeFilter = $(this).data('filter');
    renderTaskList(allTasks);
});

// search tasks based on the user input
$(document).on('input', '#search-input', function() {
    var query = $(this).val().toLowerCase().trim();

    if (!query) {
        renderTaskList(allTasks);
        return;
    }

    var matchingTasks = allTasks.filter(function(task) {
        var searchableText = task.title + ' ' + (task.description || '') + ' ' + (task.category || '');
        return searchableText.toLowerCase().includes(query);
    });

    renderTaskList(matchingTasks);
});

// user state persistance if user are already logged in
$(document).on('pageshow', '#page-login', function() {
    if (token && currentUser) {
        $.mobile.navigate('#page-home');
    }
});
