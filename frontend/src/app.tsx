import { Router, Route, route } from "preact-router";
import HomePage from "./routes/home";
import PublicPage from "./routes/public";
import LogoutPage from "./routes/logout";
import AuthCallback from "./components/auth/auth-callback";
import { Fragment } from "preact/jsx-runtime";
import { AuthContext } from "./context/auth.context";
import { RouteProps } from "./utils/component.utils";
import { IsLoggedIn } from './components/auth/isLoggedIn';

const NotFound = () => {
  return (
    <main>
      <div class="card">
        <h1>404 Not Found</h1>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    </main>
  );
};

export function App() {
  return (
    <Router>
      <Route path="/logout" component={LogoutPage} />
      <Route path="/auth/code" component={AuthCallback} />
      <Route path="/" component={PublicPage} />
      <AuthenticatedRoutes path="/app/:rest*" />
      <Route default component={NotFound} />
    </Router>
  );
}

function AuthenticatedRoutes(props: RouteProps) {
  return (
    <AuthContext>
      <Router>
        <IsLoggedIn path="/app" component={HomePage} />
      </Router>
    </AuthContext>
  )
}
