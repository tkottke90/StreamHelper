import { Signal } from "@preact/signals";
import { UserDTO } from '../../../backend/src/dto/user.dto';

const currentUser = new Signal<UserDTO | undefined>();

function clearUser() {
  currentUser.value = undefined;
}

function setUser(user: UserDTO) {
  currentUser.value = user;
}

function getUserById(id: number) {

}

export function useUserService() {
  return {
    currentUser,
    clearUser,
    setUser
  }
}