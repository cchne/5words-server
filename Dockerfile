# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app
# RUN apt-get clean
# RUN apt-get update
# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of your application code to the container
COPY . ./

# Specify the command to run your Node.js application
RUN npx tsc
CMD ["npm", "run", "start"]