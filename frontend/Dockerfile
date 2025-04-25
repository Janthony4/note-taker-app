FROM node:18

WORKDIR /app

COPY package*.json ./

# Install frontend dependencies and dev tools
RUN npm install && \
	npm install vite @vitejs/plugin-vue typescript @vue/compiler-sfc --save-dev && \
	npm install @tsconfig/node22

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
