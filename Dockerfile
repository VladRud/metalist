FROM node:boron
RUN mkdir /app
WORKDIR /app

COPY package.json /app

RUN yarn install --production

ADD /dist /app

EXPOSE 80
