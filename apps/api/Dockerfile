# Namma Guruvayoor API — production image
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/
COPY packages/config/package.json packages/config/
COPY packages/types/package.json packages/types/
COPY packages/database/package.json packages/database/
RUN npm ci --workspace @gsv/api --include-workspace-root || npm install
COPY tsconfig.base.json ./
COPY apps/api apps/api
COPY packages packages
RUN npm run build -w @gsv/config && npm run build -w @gsv/types && npm run build -w @gsv/database && npm run build -w @gsv/api

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/apps/api/package.json apps/api/
COPY --from=build /app/packages/config/package.json packages/config/
COPY --from=build /app/packages/types/package.json packages/types/
COPY --from=build /app/packages/database/package.json packages/database/
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/packages/config/dist packages/config/dist
COPY --from=build /app/packages/types/dist packages/types/dist
COPY --from=build /app/packages/database/dist packages/database/dist
EXPOSE 4000
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
