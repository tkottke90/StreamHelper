import { Button } from "../form/button";


export function LoginButton() {
  return (<Button variant="primaryRaised" onClick={() => window.location.replace("/api/v1/auth/login")}>Login</Button>)
}