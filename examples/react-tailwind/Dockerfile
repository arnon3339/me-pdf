FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Expose the dev server port
EXPOSE 3000

# Use entrypoint script to install deps and start dev server
COPY examples/react-tailwind/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
