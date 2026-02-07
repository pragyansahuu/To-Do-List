$(document).ready(function () {
  // Load tasks from localStorage on page load
  loadTasks();
  
  // Load saved files list
  displaySavedFiles();

  // Update date and time display
  function updateDateTime() {
    let now = new Date();
    let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    let dateTimeString = now.toLocaleDateString('en-US', options);
    $("#dateTimeDisplay").text(dateTimeString);
  }
  
  updateDateTime(); // Call immediately
  setInterval(updateDateTime, 1000); // Update every second

  // Add new task
  $("#button").click(function () {
    let toAdd = $("#listItem").val();

    if (toAdd.trim() === "") {
      return;
    }

    addTask(toAdd);
    $("#listItem").val("");
  });

  // Save button click
  $("#saveBtn").click(function () {
    // Ask user for filename
    let fileName = prompt("Enter filename for your to-do list:", "my-tasks");
    
    if (fileName === null) {
      return; // User cancelled
    }

    if (fileName.trim() === "") {
      alert("Please enter a valid filename!");
      return;
    }

    // Save to localStorage first
    saveTasks();
    
    // Get tasks data
    let tasks = JSON.parse(localStorage.getItem("todoTasks")) || [];
    
    // Create JSON data
    let jsonData = {
      name: fileName,
      createdDate: new Date().toLocaleString(),
      tasks: tasks
    };

    // Create downloadable file
    let dataStr = JSON.stringify(jsonData, null, 2);
    let dataBlob = new Blob([dataStr], { type: "application/json" });
    let url = URL.createObjectURL(dataBlob);
    
    // Create download link
    let link = document.createElement("a");
    link.href = url;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Save file to history
    saveFileToHistory(fileName, new Date().toLocaleString());
    
    alert("✓ File saved as: " + fileName + ".json");
  });

  // Share button click - show modal
  $(document).on("click", "#shareBtn", function () {
    $("#shareModal").addClass("show");
  });

  // Close modal
  $(document).on("click", ".close-modal", function () {
    $("#shareModal").removeClass("show");
    $("#viewFileModal").removeClass("show");
  });

  // Close modal when clicking outside
  $(document).on("click", "#shareModal", function (e) {
    if (e.target.id === "shareModal") {
      $("#shareModal").removeClass("show");
    }
  });

  // Close view file modal when clicking outside
  $(document).on("click", "#viewFileModal", function (e) {
    if (e.target.id === "viewFileModal") {
      $("#viewFileModal").removeClass("show");
    }
  });

  // Get tasks as formatted text
  function getTasksText() {
    let tasksList = [];
    $("#todoList li").each(function () {
      let text = $(this).find("label").text();
      let isChecked = $(this).find("input[type='checkbox']").is(":checked");
      let checkmark = isChecked ? "✓" : "○";
      tasksList.push(checkmark + " " + text);
    });
    return "My To-Do List:\n\n" + tasksList.join("\n");
  }

  // WhatsApp Share
  $(document).on("click", "#whatsappShare", function (e) {
    e.preventDefault();
    let text = encodeURIComponent(getTasksText());
    window.open("https://wa.me/?text=" + text, "_blank");
    $("#shareModal").removeClass("show");
  });

  // Email Share
  $(document).on("click", "#emailShare", function (e) {
    e.preventDefault();
    let subject = encodeURIComponent("My To-Do List");
    let body = encodeURIComponent(getTasksText());
    window.location.href = "mailto:?subject=" + subject + "&body=" + body;
    $("#shareModal").removeClass("show");
  });

  // Telegram Share
  $(document).on("click", "#telegramShare", function (e) {
    e.preventDefault();
    let text = encodeURIComponent(getTasksText());
    window.open("https://t.me/share/url?text=" + text, "_blank");
    $("#shareModal").removeClass("show");
  });

  // Twitter Share
  $(document).on("click", "#twitterShare", function (e) {
    e.preventDefault();
    let text = encodeURIComponent(getTasksText());
    window.open("https://twitter.com/intent/tweet?text=" + text, "_blank");
    $("#shareModal").removeClass("show");
  });

  // Copy to Clipboard
  $(document).on("click", "#copyShare", function (e) {
    e.preventDefault();
    let text = getTasksText();
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        alert("✓ Tasks copied to clipboard! Ready to share 📤");
        $("#shareModal").removeClass("show");
      });
    } else {
      let textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("✓ Tasks copied to clipboard! Ready to share 📤");
      $("#shareModal").removeClass("show");
    }
  });

  // Delete button functionality
  $(document).on("click", ".delete-btn", function () {
    let taskText = $(this).closest("li").find("label").text();
    $(this).closest("li").remove();
    deleteTask(taskText);
  });

  // Update checkbox state
  $(document).on("change", "input[type='checkbox']", function () {
    let taskText = $(this).closest("li").find("label").text();
    let isChecked = $(this).is(":checked");
    updateTaskStatus(taskText, isChecked);
  });

  // Allow Enter key to add task
  $("#listItem").keypress(function (e) {
    if (e.which == 13) {
      $("#button").click();
      return false;
    }
  });

  // File click event - view contents
  $(document).on("click", ".file-list-item", function (e) {
    if (!$(e.target).hasClass("file-delete-btn")) {
      let fileId = $(this).data("id");
      viewFileContents(fileId);
    }
  });

  // Delete file event
  $(document).on("click", ".file-delete-btn", function (e) {
    e.stopPropagation();
    let fileId = $(this).data("id");
    deleteFromHistory(fileId);
  });
});

// Save tasks to localStorage
function saveTasks() {
  let tasks = [];
  $("#todoList li").each(function () {
    let text = $(this).find("label").text();
    let isChecked = $(this).find("input[type='checkbox']").is(":checked");
    tasks.push({ text: text, completed: isChecked });
  });
  localStorage.setItem("todoTasks", JSON.stringify(tasks));
}

// Load tasks from localStorage
function loadTasks() {
  let tasks = JSON.parse(localStorage.getItem("todoTasks")) || [];
  tasks.forEach(function (task) {
    let checkedAttr = task.completed ? "checked" : "";
    $("#todoList").append(
      "<li><input type='checkbox' " + checkedAttr + " /><label>" + task.text + "</label><button class='delete-btn'>×</button></li>"
    );
  });
}

// Add task and save
function addTask(taskText) {
  $("#todoList").append(
    "<li><input type='checkbox'><label>" + taskText + "</label><button class='delete-btn'>×</button></li>"
  );
  saveTasks();
}

// Delete task and save
function deleteTask(taskText) {
  saveTasks();
}

// Update task status and save
function updateTaskStatus(taskText, isChecked) {
  saveTasks();
}

// Save file to history
function saveFileToHistory(fileName, dateTime) {
  let savedFiles = JSON.parse(localStorage.getItem("savedFilesHistory")) || [];
  let tasks = JSON.parse(localStorage.getItem("todoTasks")) || [];
  
  // Add new file to the beginning of the array
  savedFiles.unshift({
    id: Date.now(),
    name: fileName,
    date: dateTime,
    tasks: tasks
  });
  
  // Keep only last 10 files
  if (savedFiles.length > 10) {
    savedFiles = savedFiles.slice(0, 10);
  }
  
  localStorage.setItem("savedFilesHistory", JSON.stringify(savedFiles));
  displaySavedFiles();
}

// Display saved files list
function displaySavedFiles() {
  let savedFiles = JSON.parse(localStorage.getItem("savedFilesHistory")) || [];
  let filesList = $("#savedFilesList");
  
  filesList.empty();
  
  if (savedFiles.length === 0) {
    filesList.append('<li class="no-files">No saved files yet</li>');
    return;
  }
  
  savedFiles.forEach(function (file) {
    let fileItem = `
      <li class="file-list-item" data-id="${file.id}">
        <div class="file-info">
          <div class="file-name">📄 ${file.name}.json</div>
          <div class="file-date">${file.date}</div>
        </div>
        <div class="file-actions">
          <button class="file-delete-btn" data-id="${file.id}">Delete</button>
        </div>
      </li>
    `;
    filesList.append(fileItem);
  });
}

// Delete file from history
function deleteFromHistory(fileId) {
  let savedFiles = JSON.parse(localStorage.getItem("savedFilesHistory")) || [];
  savedFiles = savedFiles.filter(function (file) {
    return file.id !== fileId;
  });
  
  localStorage.setItem("savedFilesHistory", JSON.stringify(savedFiles));
  displaySavedFiles();
}

// Current file being viewed
let currentViewingFile = null;

// View file contents
function viewFileContents(fileId) {
  let savedFiles = JSON.parse(localStorage.getItem("savedFilesHistory")) || [];
  let file = savedFiles.find(function (f) {
    return f.id == fileId;
  });
  
  if (!file) {
    alert("File not found!");
    return;
  }
  
  currentViewingFile = file;
  
  // Update modal header and date
  $("#fileViewTitle").text("📄 " + file.name);
  $("#fileViewDate").text("Saved: " + file.date);
  
  // Display tasks
  let tasksHtml = "";
  if (!file.tasks || file.tasks.length === 0) {
    tasksHtml = '<div class="no-tasks-message">No tasks in this file</div>';
  } else {
    file.tasks.forEach(function (task) {
      let statusIcon = task.completed ? "✓" : "○";
      let completedClass = task.completed ? "completed" : "";
      tasksHtml += `
        <div class="file-task-item ${completedClass}">
          <span class="task-status">${statusIcon}</span>
          <span class="task-text">${task.text}</span>
        </div>
      `;
    });
  }
  
  $("#fileViewTasks").html(tasksHtml);
  
  // Show modal
  $("#viewFileModal").addClass("show");
}

// Load file tasks into current list
$(document).on("click", "#loadFileBtn", function () {
  if (!currentViewingFile) {
    alert("No file selected!");
    return;
  }
  
  if (confirm("Load tasks from '" + currentViewingFile.name + "'? Current tasks will be replaced.")) {
    localStorage.setItem("todoTasks", JSON.stringify(currentViewingFile.tasks));
    $("#todoList").empty();
    loadTasks();
    $("#viewFileModal").removeClass("show");
    alert("✓ Tasks loaded successfully!");
  }
});

// Download file from history
$(document).on("click", "#downloadFileBtn", function () {
  if (!currentViewingFile) {
    alert("No file selected!");
    return;
  }
  
  // Create JSON data
  let jsonData = {
    name: currentViewingFile.name,
    createdDate: currentViewingFile.date,
    tasks: currentViewingFile.tasks
  };
  
  // Create downloadable file
  let dataStr = JSON.stringify(jsonData, null, 2);
  let dataBlob = new Blob([dataStr], { type: "application/json" });
  let url = URL.createObjectURL(dataBlob);
  
  // Create download link
  let link = document.createElement("a");
  link.href = url;
  link.download = currentViewingFile.name + ".json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  alert("✓ File downloaded: " + currentViewingFile.name + ".json");
});
