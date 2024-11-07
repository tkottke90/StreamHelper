// Controllers manage HTTP requests coming to the system.  Create
// individual controller files in this directory, import them here
// and then add them to the array of controllers in the attach
// controllers method

import { readdir } from 'fs/promises';
import { attachControllers } from '@decorators/express';
import { Application, Router } from 'express';
import path from 'path';
import { V1_Route } from '../routes';

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
  getControllers(V1_Router);

  app.use(V1_Route.fullPath, V1_Router);
}
