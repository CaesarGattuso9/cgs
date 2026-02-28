FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache ffmpeg libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run prisma:generate && npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run prisma:push && npm run start"]
