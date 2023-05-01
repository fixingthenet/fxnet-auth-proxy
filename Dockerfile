FROM node:16.13.0-bullseye

ENV APP_DIR=/code
WORKDIR $APP_DIR
ADD .yarnrc /root/.yarnrc

ENV PATH="/install/node_modules/.bin:${PATH}"

COPY package.json $APP_DIR
COPY yarn.lock $APP_DIR
RUN ln -s /install/node_modules node_modules

RUN yarn install
ADD . $APP_DIR
#RUN yarn run build

CMD ["node", "src/index.js"]
