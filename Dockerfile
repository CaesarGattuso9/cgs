FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache ffmpeg libc6-compat

ENV DATABASE_URL=postgresql://lifelog:lifelog@db:5432/lifelog?schema=public

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run prisma:generate && npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run prisma:push && npm run start"]
