FROM node:20-alpine

WORKDIR /usr/app

COPY package.json ./
RUN npm install && npm cache clean --force

COPY tsconfig.json ./

COPY src ./src
COPY .env ./

EXPOSE ${OUTER_PORT}

RUN npm run build

CMD ["npm", "run", "start"]