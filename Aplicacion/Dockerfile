FROM node:lts-alpine

WORKDIR /app

#copia el package.json y el package-lock.json
COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "dev"]