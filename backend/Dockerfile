FROM node:18

WORKDIR /app

COPY package*.json ./

# Install backend dependencies + express-session
RUN npm install && \
	npm install express-session

COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
