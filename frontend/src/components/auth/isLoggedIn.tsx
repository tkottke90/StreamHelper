import { Route, RouteProps } from "preact-router";
import { useAuthContext } from "../../context/auth.context";


export function IsLoggedIn({component, path}: RouteProps<{}>) {
  const { currentUser, login } = useAuthContext();

  if (!currentUser.value) {
    login();
    return null;
  }

  return (<Route path={path} component={component} />)
}