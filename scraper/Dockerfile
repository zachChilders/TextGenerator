
FROM node:alpine

WORKDIR ~
COPY . .
RUN npm install
RUN npm run build-ts

EXPOSE 80
CMD npm start
