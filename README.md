# Notes App

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- **Docker** 
- **Docker Compose** 
- **Git** 

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Janthony4/note-taker-app
cd note-taker-app

"MONGO_URI=mongodb://mongo:27017/notes" | Out-File -FilePath backend/.env -Encoding ASCII

cd frontend
npm install vite @vitejs/plugin-vue typescript @vue/compiler-sfc --save-dev
cd ..

docker-compose up -d --build

docker-compose ps
