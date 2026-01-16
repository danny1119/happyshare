# Base image
FROM node:25

WORKDIR /app

# Copy everything
COPY . .

# Install backend dependencies and generate Prisma client
RUN cd server && npm install && npm run db:generate

# Install frontend dependencies
RUN cd client && npm install

# Expose ports
EXPOSE 3001 3000

# Copy and run start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh
CMD ["/app/start.sh"]
