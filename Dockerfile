FROM node:18 AS build
WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .
RUN npm run build

FROM node:18 AS production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json .
COPY --from=build /app/node_modules ./node_modules

CMD ["npm", "run", "serve"]

