class PhotoUploader {
  constructor() {
    this.apiEndpoint = "/api/v1/file/upload/image";
    this.initializeElements();
    this.attachEventListeners();
  }

  initializeElements() {
    this.uploadArea = document.getElementById("uploadArea");
    this.fileInput = document.getElementById("fileInput");
    this.progressContainer = document.getElementById("progressContainer");
    this.progressFill = document.getElementById("progressFill");
    this.progressText = document.getElementById("progressText");
    this.resultContainer = document.getElementById("resultContainer");
    this.resultUrl = document.getElementById("resultUrl");
    this.copyBtn = document.getElementById("copyBtn");
    this.previewImage = document.getElementById("previewImage");
    this.uploadAnotherBtn = document.getElementById("uploadAnotherBtn");
    this.errorContainer = document.getElementById("errorContainer");
    this.errorMessage = document.getElementById("errorMessage");
    this.retryBtn = document.getElementById("retryBtn");
  }

  attachEventListeners() {
    // Click to upload
    this.uploadArea.addEventListener("click", () => {
      this.fileInput.click();
    });

    // File input change
    this.fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFile(file);
      }
    });

    // Drag and drop
    this.uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.uploadArea.classList.add("drag-over");
    });

    this.uploadArea.addEventListener("dragleave", () => {
      this.uploadArea.classList.remove("drag-over");
    });

    this.uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      this.uploadArea.classList.remove("drag-over");

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/")) {
          this.handleFile(file);
        } else {
          this.showError("Please select an image file.");
        }
      }
    });

    // Copy URL button
    this.copyBtn.addEventListener("click", () => {
      this.copyToClipboard();
    });

    // Upload another button
    this.uploadAnotherBtn.addEventListener("click", () => {
      this.resetUploader();
    });

    // Retry button
    this.retryBtn.addEventListener("click", () => {
      this.resetUploader();
    });
  }

  handleFile(file) {
    // Validate file
    if (!file.type.startsWith("image/")) {
      this.showError("Please select an image file.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      // 15MB limit
      this.showError("File size must be less than 15MB.");
      return;
    }

    this.uploadFile(file);
  }

  async uploadFile(file) {
    this.hideAllContainers();
    this.showProgress();

    const formData = new FormData();
    formData.append("image", file);

    try {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          this.updateProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.data && response.data.url) {
              this.showSuccess(response.data.url, file);
            } else {
              this.showError("Upload failed: Invalid response format.");
            }
          } catch (e) {
            this.showError("Upload failed: Invalid response.");
          }
        } else {
          this.showError(`Upload failed: ${xhr.status} ${xhr.statusText}`);
        }
      });

      xhr.addEventListener("error", () => {
        this.showError("Upload failed: Network error.");
      });

      xhr.open("POST", this.apiEndpoint);
      xhr.send(formData);
    } catch (error) {
      this.showError(`Upload failed: ${error.message}`);
    }
  }

  showProgress() {
    this.progressContainer.style.display = "block";
    this.updateProgress(0);
  }

  updateProgress(percent) {
    this.progressFill.style.width = `${percent}%`;
    this.progressText.textContent = `Uploading... ${Math.round(percent)}%`;
  }

  showSuccess(url, file) {
    this.hideAllContainers();
    this.resultContainer.style.display = "block";
    this.resultUrl.value = url;

    // Show image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  showError(message) {
    this.hideAllContainers();
    this.errorContainer.style.display = "block";
    this.errorMessage.textContent = message;
  }

  hideAllContainers() {
    this.progressContainer.style.display = "none";
    this.resultContainer.style.display = "none";
    this.errorContainer.style.display = "none";
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.resultUrl.value);
      const originalText = this.copyBtn.textContent;
      this.copyBtn.textContent = "Copied!";
      this.copyBtn.style.background = "#059669";

      setTimeout(() => {
        this.copyBtn.textContent = originalText;
        this.copyBtn.style.background = "#667eea";
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      this.resultUrl.select();
      document.execCommand("copy");
      this.copyBtn.textContent = "Copied!";
    }
  }

  resetUploader() {
    this.hideAllContainers();
    this.fileInput.value = "";
    this.uploadArea.style.display = "block";
  }
}

// Initialize the uploader when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PhotoUploader();
});
