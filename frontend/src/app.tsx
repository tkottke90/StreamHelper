import { Router, Route, route } from 'preact-router'
import './app.scss'
import LoginPage from './routes/login'
import HomePage from './routes/home'
import PublicPage from './routes/public'


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
    <>
      <Router>
          <Route path="/" component={PublicPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/app" component={HomePage} />
          <Route default component={NotFound}/>
      </Router>
    </>
  )
}
