FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY server ./server
USER node
EXPOSE 3001
CMD ["node", "server/index.js"]
