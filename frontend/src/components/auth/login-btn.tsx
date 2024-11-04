

export function LoginButton() {
  return (<button onClick={() => window.location.replace("/api/auth/login")}>Login</button>)
}