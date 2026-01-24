// Firebase Configuration - You need to replace with your own config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// DOM Elements
let fileInput, uploadArea, uploadDetails, shareLinkContainer, progressFill, uploadStatus;
let shareableLink, viewLink;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    fileInput = document.getElementById('pdfFile');
    uploadArea = document.getElementById('uploadArea');
    uploadDetails = document.getElementById('uploadDetails');
    shareLinkContainer = document.getElementById('shareLinkContainer');
    progressFill = document.getElementById('progressFill');
    uploadStatus = document.getElementById('uploadStatus');
    shareableLink = document.getElementById('shareableLink');
    viewLink = document.getElementById('viewLink');

    if (fileInput) {
        setupUpload();
    }
});

function setupUpload() {
    // Click on upload area triggers file input
    uploadArea.addEventListener('click', function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
            fileInput.click();
        }
    });

    // Handle file selection
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        uploadArea.style.borderColor = '#764ba2';
        uploadArea.style.backgroundColor = '#f9f7ff';
    }

    function unhighlight() {
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.backgroundColor = 'white';
    }

    // Handle dropped files
    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            fileInput.files = files;
            handleFileSelect();
        } else {
            alert('Please drop a PDF file only');
        }
    }
}

function handleFileSelect() {
    const file = fileInput.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
        alert('Please select a PDF file only');
        return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
    }

    // Show upload details
    uploadArea.style.display = 'none';
    uploadDetails.style.display = 'block';

    // Upload file
    uploadFile(file);
}

function uploadFile(file) {
    // Create a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}_${randomString}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Create storage reference
    const storageRef = ref(storage, `pdfs/${fileName}`);
    
    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Monitor upload progress
    uploadTask.on('state_changed',
        (snapshot) => {
            // Update progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressFill.style.width = `${progress}%`;
            uploadStatus.textContent = `Uploading: ${Math.round(progress)}%`;
        },
        (error) => {
            // Handle errors
            console.error('Upload error:', error);
            alert('Upload failed. Please try again.');
            resetUploadForm();
        },
        () => {
            // Upload complete
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                // Generate shareable link
                const shareableURL = `${window.location.origin}/view.html?pdf=${encodeURIComponent(downloadURL)}`;
                
                // Update UI
                uploadDetails.style.display = 'none';
                shareLinkContainer.style.display = 'block';
                shareableLink.value = shareableURL;
                viewLink.href = shareableURL;
                
                uploadStatus.textContent = 'Upload complete!';
            });
        }
    );
}

function copyLink() {
    const linkInput = document.getElementById('shareableLink');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        navigator.clipboard.writeText(linkInput.value).then(() => {
            const copyBtn = document.querySelector('.btn-copy');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyBtn.style.background = '#218838';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.background = '';
            }, 2000);
        });
    } catch (err) {
        // Fallback for older browsers
        document.execCommand('copy');
        alert('Link copied to clipboard!');
    }
}

function resetUploadForm() {
    uploadArea.style.display = 'block';
    uploadDetails.style.display = 'none';
    shareLinkContainer.style.display = 'none';
    progressFill.style.width = '0%';
    fileInput.value = '';
}