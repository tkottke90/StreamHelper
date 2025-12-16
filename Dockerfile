# Final Image - expects pre-built artifacts from host
FROM node:22

WORKDIR /usr/app/

# Install ffmpeg for multicast streaming
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Copy Prisma schema and config
COPY ./backend/prisma ./prisma
COPY ./backend/dist/prisma.config.js ./prisma.config.js

# Copy compiled application
COPY ./backend/dist ./dist

# Copy frontend static files
COPY ./frontend/dist /usr/app/public

# Copy package files and entrypoint
COPY ./backend/package*.json ./
COPY ./backend/bin/entrypoint.sh /usr/app/

# Copy node_modules (pre-installed on host)
COPY ./backend/node_modules /usr/app/node_modules

# Generate Prisma Client
RUN npx prisma generate

CMD [ "/bin/bash", "./entrypoint.sh" ]

ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000