import { Router, Route, route } from 'preact-router'
import LoginPage from './routes/login'
import HomePage from './routes/home'
import PublicPage from './routes/public'
import LogoutPage from './routes/logout'
import AuthCallback from './components/auth/auth-callback'
import { Fragment } from 'preact/jsx-runtime'


const NotFound = () => {
  return (
    <main>
      <div class="card">
        <h1>404 Not Found</h1>
        <button onClick={() => route('/')} >Go Back</button>
      </div>
    </main>
  )
}

export function App() {
  return (
    <Fragment>
      <Router>
          <Route path="/logout" component={LogoutPage} />
          <Route path="/app" component={HomePage} />
          <Route path="/auth/code" component={AuthCallback}/>
          <Route path="/" component={PublicPage} />
          <Route default component={NotFound}/>
      </Router>
    </Fragment>
  )
}
