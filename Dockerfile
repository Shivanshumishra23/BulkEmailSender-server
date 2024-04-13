# Use an official Node.js runtime as a base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json /

# Install application dependencies
RUN npm install

# Copy the application code to the container
COPY . .

# Expose the port on which your application will run
EXPOSE 5000

# Define the command to run your application
CMD ["npm","start"]
