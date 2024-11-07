

export function LoginButton() {
  return (<button onClick={() => window.location.replace("/api/v1/auth/login")}>Login</button>)
}