FROM node:20-alpine AS builder

WORKDIR /app

# Install yarn
RUN corepack enable && corepack prepare yarn@stable --activate

COPY package*.json yarn.lock ./
RUN yarn install --immutable

COPY . .
RUN yarn build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install yarn
RUN corepack enable && corepack prepare yarn@stable --activate

COPY package*.json yarn.lock ./
RUN yarn workspaces focus

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/sequelize ./sequelize
COPY --from=builder /app/.sequelizerc ./.sequelizerc
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]