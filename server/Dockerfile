FROM node:22-alpine
WORKDIR /app
COPY package*.json ./

# FIX: Install specific version compatible with 'require'
RUN npm install music-metadata@7.14.0
RUN npm install

COPY . .
EXPOSE 5000
CMD ["node", "index.js"]