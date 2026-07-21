FROM mcr.microsoft.com/playwright:v1.59.1-jammy

WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "run", "start"]
