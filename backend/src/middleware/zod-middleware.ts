import { NextFunction, Request, Response } from 'express';
import { z, ZodError, ZodObject, ZodRawShape } from 'zod';
import { BadRequestError } from '../utilities/errors.util.js';
import { WsEventContext } from '../websockets/types.js';

export function ZodWebsocketValidator<T extends ZodRawShape>(schema: ZodObject<T>) {
  return async (context: WsEventContext, next: (error?: any) => void) => {
    const { success, error, data } = schema.safeParse(context.json);
    
    if (!success || error) {
      const badReqError = new BadRequestError('Validation Failed');
      badReqError.details = error.flatten();
      return next(error);
    }
    
    return next();
  };
}

export function ZodBodyValidator<T extends ZodRawShape>(schema: ZodObject<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      let message = 'Validation Failed';
      let details: any = {};

      if (err instanceof ZodError) {
        message = `Validation failed: ${err.issues.length} errors detected in body`;
        details = err.issues;
      }

      const badReqError = new BadRequestError(message);
      badReqError.details = details;

      next(badReqError);
    }
  };
}

export function ZodQueryValidator<T extends ZodRawShape>(schema: ZodObject<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      let message = 'Query Format Error';
      let details: any = {};

      if (err instanceof ZodError) {
        message = `Validation failed: ${err.issues.length} errors detected in query params`;
        details = err.issues;
      }

      const badReqError = new BadRequestError(message);
      badReqError.details = details;

      next(badReqError);
    }
  };
}

export function ZodParamValidator<T extends ZodRawShape>(schema: ZodObject<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (err) {
      let message = 'Query Format Error';
      let details: any = {};

      if (err instanceof ZodError) {
        message = `Validation failed: ${err.issues.length} errors detected in url params`;
        details = err.issues;
      }

      const badReqError = new BadRequestError(message);
      badReqError.details = details;

      next(badReqError);
    }
  };
}

export function ZodIdValidator(idField = 'id') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params[idField] = z
        .number({ coerce: true })
        .parse(req.params[idField]) as any;
      next();
    } catch (err) {
      let message = 'Query Format Error';
      let details: any = {};

      if (err instanceof ZodError) {
        message = err.message;
        details = err.issues;
      }

      const badReqError = new BadRequestError(message);
      badReqError.details = details;

      next(badReqError);
    }
  };
}
