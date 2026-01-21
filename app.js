* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    overflow-x: hidden;
}

/* Hide scrollbar */
::-webkit-scrollbar {
    display: none;
}

body {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

#app {
    max-width: 480px;
    margin: 0 auto;
    padding: 20px;
    padding-bottom: 100px;
}

.header {
    text-align: center;
    color: white;
    margin-bottom: 30px;
}

.header h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
}

.setup-screen {
    background: white;
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.setup-screen input {
    width: 100%;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    margin: 10px 0;
}

.setup-screen input[type="text"],
.setup-screen input[type="email"],
.setup-screen input[type="tel"] {
    font-family: inherit;
}

.btn {
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 14px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 10px;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.event-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    margin-bottom: 20px;
}

.event-card img {
    width: 100%;
    height: 280px;
    object-fit: cover;
}

.event-content {
    padding: 20px;
}

.event-content h2 {
    font-size: 1.5rem;
    margin-bottom: 10px;
}

.event-meta {
    color: #6b7280;
    font-size: 0.9rem;
    margin-bottom: 15px;
    line-height: 1.6;
}

.event-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.event-actions button {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 10px;
    font-weight: bold;
    cursor: pointer;
    font-size: 14px;
    transition: transform 0.2s;
}

.event-actions button:active {
    transform: scale(0.95);
}

.pass-btn {
    background: #f3f4f6;
    color: #374151;
}

.pass-btn:hover {
    background: #e5e7eb;
}

.interested-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.interested-btn:hover {
    background: linear-gradient(135deg, #5568d3 0%, #6a3b8f 100%);
}

.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #e5e7eb;
    padding: 15px;
    display: flex;
    justify-content: space-around;
    max-width: 480px;
    margin: 0 auto;
    z-index: 100;
}

.nav-btn {
    background: none;
    border: none;
    color: #6b7280;
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    transition: color 0.2s;
}

.nav-btn span:first-child {
    font-size: 1.5rem;
}

.nav-btn.active {
    color: #667eea;
}

.hidden {
    display: none;
}

.loading {
    text-align: center;
    padding: 50px;
    color: white;
}

.filter-pills {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    margin-bottom: 20px;
    padding-bottom: 10px;
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.filter-pills::-webkit-scrollbar {
    display: none;
}

.filter-pill {
    padding: 8px 16px;
    background: white;
    border: 2px solid white;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
}

.filter-pill:hover {
    transform: translateY(-2px);
}

.filter-pill.active {
    background: #667eea;
    color: white;
    border-color: #667eea;
}
