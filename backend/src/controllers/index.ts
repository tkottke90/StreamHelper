// Controllers manage HTTP requests coming to the system.  Create
// individual controller files in this directory, import them here
// and then add them to the array of controllers in the attach
// controllers method

import { readdir } from 'fs/promises';
import { attachControllers } from '@decorators/express';
import { Application, Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { V1_Route } from '../routes.js';
import { rateLimit } from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const limiter = rateLimit({
  windowMs: 1000, // 15 minutes
  limit: 20, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false // Disable the `X-RateLimit-*` headers.
});

async function getControllers(app: Application | Router) {
  const files = (await readdir(path.resolve(__dirname))).filter((filename) =>
    filename.includes('.controller.')
  );

  const controllers = await Promise.all(
    files.map((file) =>
      import(path.resolve(__dirname, file)).then((module) => module.default)
    )
  );

  attachControllers(app, controllers);
}

const V1_Router = Router();

export default function (app: Application) {
  V1_Router.use(limiter);
  getControllers(V1_Router);

  app.use(V1_Route.fullPath, V1_Router);
}
