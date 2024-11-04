import { useSignalEffect } from '@preact/signals'
import { useUserService } from '../../services/user.service';
import { UserDTO } from '../../../../backend/src/dto/user.dto';
import { route } from 'preact-router';

function fetchJsonResponse(errorCb: (response: Response) => void) {
  return (response: Response) => {
    if (!response.ok) {
      errorCb(response);
    }

    return response.json();
  }
}

export default function AuthCallback() {
  const { setUser } = useUserService();

  useSignalEffect(() => {
    fetch(`/api/auth/code${window.location.search}`)
      .then(fetchJsonResponse(response => {
        throw Error(`Auth Callback rejected: ${response.status} - ${response.statusText}`)
      }))
      .then(responseBody => {
        if (!responseBody.token) {
          console.error(`Response body missing token`);
          throw Error('Invalid callback body');
        }

        const headers = new Headers();
        headers.append('Authorization', `Bearer ${responseBody.token}`);

        return fetch('/api/auth/me', { headers })
      })
      .then(fetchJsonResponse(response => {
        route('/logout')
        throw Error(`Me endpoint rejected: ${response.status} - ${response.statusText}`)
      }))
      .then((responseBody: UserDTO) => {
        setUser(responseBody)
        route('/app')
      })
  });

  return (
    <div>
      Logging you in
    </div>
  )
}