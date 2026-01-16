
# Base image
FROM node:25

# Set working directory
WORKDIR /app

# Copy package.json and prisma schema first
COPY package.json ./
COPY prisma ./prisma

# Install dependencies and generate Prisma client
RUN npm install && \
    npm run db:generate

# Copy the rest of the application
COPY . .
EXPOSE 3001
CMD ["npm","run","dev"]