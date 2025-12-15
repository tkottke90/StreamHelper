# Final Image - expects pre-built artifacts from host
FROM node:22

WORKDIR /usr/app/

COPY ./backend/prisma ./prisma
COPY ./backend/dist dist/dist
COPY ./frontend/dist /usr/app/public
COPY ./backend/package*.json ./
COPY ./backend/bin/entrypoint.sh /usr/app/

COPY ./backend/node_modules /usr/app/
RUN npx prisma generate

CMD [ "/bin/bash", "./entrypoint.sh" ]

ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000