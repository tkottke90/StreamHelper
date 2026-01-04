import { Route, Router } from "preact-router";
import AuthCallback from "./components/auth/auth-callback";
import { IsLoggedIn } from './components/auth/isLoggedIn';
import { AuthContext } from "./context/auth.context";
import { GameDataRoutes } from "./routes/game-data";
import HomePage from "./routes/home";
import LogoutPage from "./routes/logout";
import PublicPage from "./routes/public";
import StreamPage from "./routes/streams";
import { RouteProps } from "./utils/component.utils";

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
        <IsLoggedIn path="/app/streams" component={StreamPage} />

        <GameDataRoutes path="/app/game-data/:rest*" />
      </Router>
    </AuthContext>
  )
}
