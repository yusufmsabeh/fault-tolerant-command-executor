FROM node:alpine
WORKDIR /fault-tolerant-command-executor/agent
COPY package*.json .
RUN npm install
COPY . .
RUN npm run migrate
RUN npm run build
CMD ["npm","start"]