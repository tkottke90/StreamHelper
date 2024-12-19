import { Fragment, h } from 'preact';
import './public.scss';
import { LoginButton } from '../../components/auth/login-btn';

const PublicPage = () => {
  return(
    <Fragment>
      <main className="w-full h-full bg-slate-100 relative grid grid-cols-10">
        <video className="absolute inset-0 h-full w-full scale-150 z-0 blur-md" autoPlay muted loop>
          <source src="/video/GR86 S3W8 Highlights.mp4" type="video/mp4" />
        </video>
        <div className="text-white text-center z-50 flex flex-col justify-center items-center gap-2 gradient col-start-9 col-span-2">
          <h1>Stream Helper</h1>
          <p>Helping teams work together to solve multi-streaming issues and collaboration.</p>
          <div className="flex justify-evenly">
            <LoginButton />
          </div>
        </div>
      </main>
    </Fragment>
  )
}

export default PublicPage;