type HttpResponseFn<T> = (response: Response) => Promise<T>
type FetchFn = Promise<Response>

export class HttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly details: Record<string,any>;

  constructor(response: Response, body: string) {
    super(body);

    this.status = response.status;
    this.statusText = response.statusText;

    try {
      this.details = JSON.parse(body);
    } catch (err) {
      this.details = { body };
    }
  }

  isDataError() {
    return this.status >= 400 && this.status < 500;
  }

  isServerError() {
    return this.status >= 500;
  }

  toJSON() {
    return {
      status: this.status,
      statusText: this.statusText,
      message: this.message,
      details: this.details
    }
  }

  toString() {
    return JSON.stringify(this.toJSON())
  }
}

export async function httpRequest<T = string>(
  fetchFn: FetchFn,
  responseHandler?: HttpResponseFn<T>
) {
  const result = await fetchFn;

  if (responseHandler) {
    return responseHandler(result)
  }

  return parseTextResponse(result) as unknown as T;
}

export async function parseTextResponse(response: Response) {
  const body = await response.text();

  if (!response.ok) {
    throw new HttpError(response, body);
  }

  return body;
}

export async function parseJsonResponse<T extends Record<string, any>>(response: Response): Promise<T> {
  const body = await response.text();

  if (!response.ok) {
    throw new HttpError(response, body);
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new HttpError(response, JSON.stringify({ message: 'Unable to parse response body as JSON', originalBody: body }))
  }
}