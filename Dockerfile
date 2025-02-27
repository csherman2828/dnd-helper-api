FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
EXPOSE 3000