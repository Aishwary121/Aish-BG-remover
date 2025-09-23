import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef(null);

  const handleImageSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    } else {
      alert("Please select a valid image file.");
    }
  };

  const handleFileChange = (e) => {
    handleImageSelect(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    handleImageSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!image) return alert("Please select an image first!");

    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);

    try {
      const res = await fetch('https://aish-bg-remover.onrender.com/remove-bg', {
        method: 'POST',
        body: formData,
        // Let browser handle CORS automatically
      });
      
      const blob = await res.blob();
      setResult(URL.createObjectURL(blob));
      
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  function addAnotherImg() {
    setPreview(null);
    setResult(null);
    setImage(null);
  }

  return (
    <div className="app-container">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb1"></div>
        <div className="gradient-orb orb2"></div>
        <div className="gradient-orb orb3"></div>
      </div>

      {/* Header */}
      <header className="header">
        <div className="logo-section">
          <div className="logo-icon">
            <span>✨</span>
          </div>
          <h1 className="app-title">
            <span className="gradient-text">Magic</span> Background Remover
          </h1>
        </div>
        <p className="subtitle">Transform your images with AI-powered background removal</p>
      </header>

      {/* Main Content */}
      {!preview ? (
        /* Upload Section */
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`upload-container ${isDragging ? 'dragging' : ''}`}
        >
          <div className="upload-content">
            <div className="upload-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path d="M12 15V3m0 0l-4 4m4-4l4 4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" 
                      stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            <h3 className="upload-title">Drop your image here</h3>
            <p className="upload-subtitle">or click to browse</p>
            
            <label className="file-input-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
              />
              <span className="browse-button">
                Browse Files
              </span>
            </label>
            
            <p className="file-info">Supports: JPG, PNG, GIF, WebP (Max 10MB)</p>
          </div>
        </div>
      ) : (
        /* Image Display Section */
        <div className={`images-section ${loading || result ? 'processing' : 'preview'} ${result ? 'has-result' : ''}`}>
          <div className="image-container original">
            <h3 className="image-label">Original</h3>
            <div className="image-wrapper">
              <img src={preview} alt="Original" />
            </div>
          </div>

          <div className="process-indicator">
            {loading ? (
              <div className="loading-animation">
                <div className="spinner"></div>
                <p>Processing...</p>
              </div>
            ) : result ? (
              <div className="success-icon">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="#10B981">
                  <path d="M9 16.2l-4.2-4.2-1.4 1.4 5.6 5.6 12-12-1.4-1.4L9 16.2z"/>
                </svg>
              </div>
            ) : (
              <div className="arrow-icon">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="url(#arrowGradient)">
                  <path d="M5 12h14m0 0l-7-7m7 7l-7 7"/>
                  <defs>
                    <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            )}
          </div>

          <div className="image-container result">
            <h3 className="image-label">Result</h3>
            <div className="image-wrapper">
              {result ? (
                <img src={result} alt="Result" />
              ) : (
                <div className="placeholder">
                  <p>Background removed image will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {preview && (
        <div className="action-buttons">
          {!result && (
            <button
              onClick={handleUpload}
              className={`action-button primary ${loading ? 'disabled' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="button-spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  <span className="button-icon">🪄</span>
                  Remove Background
                </>
              )}
            </button>
          )}

          {result && (
            <a
              href={result}
              download="removed-bg.png"
              className="action-button success"
            >
              <span className="button-icon">⬇</span>
              Download Result
            </a>
          )}

          <button 
            onClick={addAnotherImg} 
            className="action-button secondary"
            disabled={loading}
          >
            <span className="button-icon">🔄</span>
            Try New Image
          </button>
        </div>
      )}
    </div>
  );
}

export default App;