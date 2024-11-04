import { LoginButton } from "../../components/auth/login-btn";
import { useUserService } from "../../services/user.service";

export default function LogoutPage() {
  const { clearUser } = useUserService();

  clearUser()
  
  return (
    <div className="drawer">
      You have successfully logged out
      <div>
        <LoginButton />
      </div>
    </div>
  );
}
