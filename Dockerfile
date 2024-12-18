# Image Asset Building
FROM node:20 AS api_build_stage

WORKDIR /usr/build

COPY ./backend ./backend
COPY ./frontend ./frontend
COPY ./styles ./styles

RUN (cd styles && npm install)

RUN (cd backend && npm install && npm run build)
RUN (cd frontend && npm install && npm run build)

# Final Image Creatioň
FROM node:20

WORKDIR /usr/app/

COPY --from=api_build_stage /usr/build/backend/prisma /usr/app/prisma
COPY --from=api_build_stage /usr/build/backend/dist /usr/app/dist
COPY --from=api_build_stage /usr/build/frontend/dist /usr/app/public
COPY ./backend/package*.json ./
COPY ./backend/bin/entrypoint.sh /usr/app/

RUN npm ci
RUN npx prisma generate

CMD [ "/bin/bash", "./entrypoint.sh" ]

ENV PORT 5000
ENV NODE_ENV production

EXPOSE 5000