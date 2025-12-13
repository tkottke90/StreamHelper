import { createContext, ComponentChildren } from "preact";
import { batch, Signal, useSignal, useSignalEffect } from "@preact/signals";
import { UserDTO } from '../../../backend/src/dto/user.dto';
import { logout, login, getAuthenticatedUserInfo } from '../services/auth.service';
import { DefaultProps } from "../utils/component.utils";

const currentUser = new Signal<UserDTO | undefined>();

function logoutUser() {
  currentUser.value = undefined;
  logout();
}

interface IAuthContext {
  user: Signal<UserDTO | undefined>
}

const defaultContext: IAuthContext = { user: new Signal<UserDTO | undefined>() }
const Context = createContext<IAuthContext>(defaultContext);

export function AuthContext({ children }: DefaultProps) {
  const checkingUser = useSignal(true)

  useSignalEffect(() => {
    getAuthenticatedUserInfo()
      .then(user => {
        batch(() => {
          currentUser.value = user;
          checkingUser.value = false
        })
      })
  });

  if (checkingUser.value) {
    return (
      <LoadingView message="Getting Things Setup" />
    )
  }

  const Provider = Context.Provider as any;

  return (
    <Provider value={defaultContext}>
      {children}
    </Provider>
  )
}

function LoadingView({ message }: {message: string}) {
  return (
    <main className="absolute inset-0 bg-inherit text-inherit" >
      <h2>{message}</h2>
    </main>
  )
}

export function useAuthContext() {

  return {
    currentUser,
    login,
    logout: logoutUser
  }
}