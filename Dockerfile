FROM node:24-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD ["pnpm", "start"]
