import { Route } from '@tkottke/hateos-url-manager';

export const Base_URL = new Route('api');
export const V1_Route = Base_URL.nest('v1');

export const UsersRoute = V1_Route.nest('users');
export const StreamRoute = V1_Route.nest('streams');
export const StreamUpdateRoute = V1_Route.nest('streams-update');
export const StreamRouteEntry = StreamRoute.nest(':id');

export const AssetsRoute = V1_Route.nest('assets');
