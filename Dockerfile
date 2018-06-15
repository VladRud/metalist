FROM node:boron
EXPOSE 80
RUN mkdir /app
WORKDIR /app

COPY package.json /app

RUN yarn install --production

ADD /dist /app
