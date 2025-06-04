FROM node:22-alpine
WORKDIR /app
#Can be made optimised by changing my build script in package.json of server
COPY ./server ./server
WORKDIR /app/server
RUN npm run build
EXPOSE 8000

CMD ["npm", "start"]