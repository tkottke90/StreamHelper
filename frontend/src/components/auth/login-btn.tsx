

export function LoginButton() {
  return (<button className="btn-primary--raised" onClick={() => window.location.replace("/api/v1/auth/login")}>Login</button>)
}